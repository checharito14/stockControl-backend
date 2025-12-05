import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AIInsight } from './entities/ai-insight.entity';
import { OpenAIService, SalesMetrics, StockMetrics, CouponMetrics } from './openai.service';
import { Sale } from '../sales/entities/sale.entity';
import { SaleDetail } from '../sales/entities/sale-detail.entity';
import { Product } from '../products/entities/product.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { User } from '../users/entities/user.entity';
import { subDays } from 'date-fns';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly CACHE_HOURS = 24;
  private readonly DAYS_TO_ANALYZE = 30;
  private readonly LOW_STOCK_THRESHOLD = 10;

  constructor(
    @InjectRepository(AIInsight)
    private readonly aiInsightRepository: Repository<AIInsight>,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleDetail)
    private readonly saleDetailRepository: Repository<SaleDetail>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly openAIService: OpenAIService,
  ) {}

  /**
   * Obtiene insights para un usuario
   * Si existen en cache (<24h) los retorna, sino genera nuevos
   */
  async getInsights(userId: number) {
    // 1. Buscar insights en cache
    const cached = await this.aiInsightRepository.findOne({
      where: { 
        userId,
        expiresAt: MoreThan(new Date()) // Solo si no han expirado
      },
    });

    if (cached) {
      this.logger.log(`✅ Retornando insights desde cache para usuario ${userId}`);
      return cached.insights;
    }

    // 2. No hay cache o expiró, generar nuevos
    this.logger.log(`⚡ Generando nuevos insights para usuario ${userId}`);
    return await this.generateInsightsForUser(userId);
  }

  /**
   * Genera nuevos insights para un usuario y los guarda en BD
   */
  async generateInsightsForUser(userId: number) {
    // 1. Obtener datos de los últimos 30 días
    const salesMetrics = await this.getSalesMetrics(userId);
    const stockMetrics = await this.getStockMetrics(userId);
    const couponMetrics = await this.getCouponMetrics(userId);

    // 2. Llamar a OpenAI para generar insights
    const insights = await this.openAIService.generateInsights(
      salesMetrics,
      stockMetrics,
      couponMetrics,
    );

    // 3. Guardar en BD con fecha de expiración (24h)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.CACHE_HOURS);

    // Buscar si ya existe un registro para este usuario
    const existingInsight = await this.aiInsightRepository.findOne({
      where: { userId },
    });

    if (existingInsight) {
      // Actualizar el registro existente
      existingInsight.insights = insights;
      existingInsight.expiresAt = expiresAt;
      existingInsight.generatedAt = new Date();
      await this.aiInsightRepository.save(existingInsight);
      this.logger.log(`🔄 Insights actualizados en cache para usuario ${userId}`);
    } else {
      // Crear nuevo registro
      await this.aiInsightRepository.save({
        userId,
        insights,
        expiresAt,
      });
      this.logger.log(`💾 Insights guardados en cache para usuario ${userId}`);
    }

    return insights;
  }

  /**
   * Obtiene métricas de ventas de los últimos 30 días
   */
  private async getSalesMetrics(userId: number): Promise<SalesMetrics> {
    const dateFrom = subDays(new Date(), this.DAYS_TO_ANALYZE);

    // Ventas del período actual (últimos 30 días)
    const currentSales = await this.saleRepository.find({
      where: {
        userId,
        createdAt: MoreThan(dateFrom),
      },
      relations: ['details'],
    });

    // Ventas del período anterior (30 días antes)
    const previousDateFrom = subDays(dateFrom, this.DAYS_TO_ANALYZE);
    const previousSales = await this.saleRepository
      .createQueryBuilder('sale')
      .where('sale.userId = :userId', { userId })
      .andWhere('sale.createdAt > :previousDateFrom', { previousDateFrom })
      .andWhere('sale.createdAt < :dateFrom', { dateFrom })
      .getMany();

    // Calcular totales
    const totalSales = currentSales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const transactionCount = currentSales.length;
    const averageTicket = transactionCount > 0 ? totalSales / transactionCount : 0;

    const previousTotalSales = previousSales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const growthPercentage = previousTotalSales > 0 
      ? ((totalSales - previousTotalSales) / previousTotalSales) * 100
      : undefined;

    // Top productos
    const topProducts = await this.getTopProducts(userId, dateFrom);

    // Mejor día de la semana
    const bestDayOfWeek = this.getBestDayOfWeek(currentSales);

    return {
      totalSales,
      transactionCount,
      averageTicket,
      growthPercentage,
      topProducts,
      bestDayOfWeek,
    };
  }

  /**
   * Obtiene los 5 productos más vendidos
   */
  private async getTopProducts(userId: number, dateFrom: Date) {
    const topProducts = await this.saleDetailRepository
      .createQueryBuilder('detail')
      .select('detail.productName', 'name')
      .addSelect('SUM(detail.quantity)', 'quantity')
      .addSelect('SUM(detail.subtotal)', 'revenue')
      .innerJoin('detail.sale', 'sale')
      .where('sale.userId = :userId', { userId })
      .andWhere('sale.createdAt > :dateFrom', { dateFrom })
      .groupBy('detail.productName')
      .orderBy('SUM(detail.quantity)', 'DESC')
      .limit(5)
      .getRawMany();

    return topProducts.map(p => ({
      name: p.name,
      quantity: Number(p.quantity),
      revenue: Number(p.revenue),
    }));
  }

  /**
   * Calcula el mejor día de la semana para ventas
   */
  private getBestDayOfWeek(sales: Sale[]): string | undefined {
    if (sales.length === 0) return undefined;

    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const salesByDay: Record<number, number> = {};

    sales.forEach(sale => {
      const dayIndex = new Date(sale.createdAt).getDay();
      salesByDay[dayIndex] = (salesByDay[dayIndex] || 0) + Number(sale.total);
    });

    const bestDay = Object.entries(salesByDay).reduce((best, [day, total]) => 
      total > best.total ? { day: Number(day), total } : best,
      { day: 0, total: 0 }
    );

    return days[bestDay.day];
  }

  /**
   * Obtiene métricas de inventario
   */
  private async getStockMetrics(userId: number): Promise<StockMetrics> {
    const allProducts = await this.productRepository.find({
      where: { userId },
    });

    const lowStockProducts = allProducts.filter(
      p => p.stock <= this.LOW_STOCK_THRESHOLD
    );

    // Para productos con stock bajo, calcular cuántos se vendieron últimos 30 días
    const dateFrom = subDays(new Date(), this.DAYS_TO_ANALYZE);
    const lowStockWithSales = await Promise.all(
      lowStockProducts.map(async (product) => {
        const sold = await this.saleDetailRepository
          .createQueryBuilder('detail')
          .select('SUM(detail.quantity)', 'total')
          .innerJoin('detail.sale', 'sale')
          .where('sale.userId = :userId', { userId })
          .andWhere('sale.createdAt > :dateFrom', { dateFrom })
          .andWhere('detail.productName = :productName', { productName: product.name })
          .getRawOne();

        return {
          name: product.name,
          stock: product.stock,
          soldLast30Days: Number(sold?.total || 0),
        };
      })
    );

    return {
      totalProducts: allProducts.length,
      lowStockProducts: lowStockWithSales,
    };
  }

  /**
   * Obtiene métricas de cupones
   */
  private async getCouponMetrics(userId: number): Promise<CouponMetrics> {
    const allCoupons = await this.couponRepository.find({
      where: { userId },
    });

    const dateFrom = subDays(new Date(), this.DAYS_TO_ANALYZE);
    const salesWithCoupons = await this.saleRepository.find({
      where: {
        userId,
        createdAt: MoreThan(dateFrom),
      },
    });

    const usedCoupons = salesWithCoupons.filter(sale => sale.couponId !== null).length;
    const discountImpact = salesWithCoupons.reduce(
      (sum, sale) => sum + Number(sale.discount),
      0
    );

    return {
      totalCoupons: allCoupons.length,
      usedCoupons,
      discountImpact,
    };
  }

  /**
   * Cron job que se ejecuta diariamente a las 2 AM
   * Genera insights para usuarios con ventas recientes
   */
  @Cron('0 2 * * *', {
    name: 'generate-daily-insights',
    timeZone: 'America/Mexico_City',
  })
  async generateDailyInsights() {
    this.logger.log('🤖 Iniciando generación diaria de insights...');

    try {
      // 1. Buscar usuarios con ventas en los últimos 7 días
      const sevenDaysAgo = subDays(new Date(), 7);
      
      const activeUsers = await this.saleRepository
        .createQueryBuilder('sale')
        .select('DISTINCT sale.userId', 'userId')
        .where('sale.createdAt > :sevenDaysAgo', { sevenDaysAgo })
        .getRawMany();

      const userIds = activeUsers.map(u => u.userId);
      
      this.logger.log(`📊 Encontrados ${userIds.length} usuarios activos`);

      if (userIds.length === 0) {
        this.logger.log('✅ No hay usuarios activos para generar insights');
        return;
      }

      // 2. Generar insights para cada usuario con delay (rate limiting)
      let successCount = 0;
      let errorCount = 0;

      for (const userId of userIds) {
        try {
          await this.generateInsightsForUser(userId);
          successCount++;
          
          // Delay de 6 segundos entre llamadas (max 10 req/min a OpenAI)
          if (userId !== userIds[userIds.length - 1]) {
            await this.sleep(6000);
          }
        } catch (error) {
          errorCount++;
          this.logger.error(
            `❌ Error generando insights para usuario ${userId}`,
            error.stack
          );
          // Continuar con el siguiente usuario
        }
      }

      this.logger.log(
        `✅ Generación diaria completada: ${successCount} exitosos, ${errorCount} errores`
      );
    } catch (error) {
      this.logger.error('❌ Error en cron job de insights', error.stack);
    }
  }

  /**
   * Utility para hacer delay entre llamadas
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
