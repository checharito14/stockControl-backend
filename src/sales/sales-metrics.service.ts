import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SalesFilterDto, PeriodType } from './dto/sales-filter.dto';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

@Injectable()
export class SalesMetricsService {
  private readonly DEFAULT_TOP_PRODUCTS_LIMIT = 3;

  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
  ) {}


  async getHistory(filterDto: SalesFilterDto, userId: number) {
    const { dateFrom, dateTo } = this.calculateDateRange(filterDto);
    const sales = await this.getSalesInRange(dateFrom, dateTo, userId);
    const stats = this.calculateSalesStats(sales);
    const topProducts = this.calculateTopProducts(
      sales,
      this.DEFAULT_TOP_PRODUCTS_LIMIT,
    );

    return {
      period: {
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
        type: filterDto.period || PeriodType.DAILY,
      },
      stats: {
        totalSales: stats.totalSales.toFixed(2),
        transactionCount: stats.transactionCount,
        topProducts,
      },
      sales: sales.map((sale) => ({
        id: sale.id,
        date: sale.createdAt,
        client: sale.client?.name || '-',
        total: Number(sale.total).toFixed(2),
        products: sale.details.length,
        discount: Number(sale.discount).toFixed(2),
      })),
    };
  }

  async getDashboardMetrics(userId: number) {
    const today = this.getTodayRange();
    const week = this.getWeekRange();

    const [todayStats, weekStats, topProductsWeek] = await Promise.all([
      this.getSalesStats(today.start, today.end, userId),
      this.getSalesStats(week.start, week.end, userId),
      this.getTopProducts(
        week.start,
        week.end,
        userId,
        this.DEFAULT_TOP_PRODUCTS_LIMIT,
      ),
    ]);

    return {
      today: {
        totalSales: todayStats.totalSales.toFixed(2),
        transactionCount: todayStats.transactionCount,
      },
      week: {
        totalSales: weekStats.totalSales.toFixed(2),
        transactionCount: weekStats.transactionCount,
      },
      topProductsWeek,
    };
  }

  async getLast30DaysActivity(userId: number) {
    const endDate = endOfDay(new Date());
    const startDate = startOfDay(new Date());
    startDate.setDate(startDate.getDate() - 29); // 30 días incluyendo hoy

    const sales = await this.getSalesInRange(startDate, endDate, userId);

    // Agrupar por día
    const dailyStats = new Map<
      string,
      { date: string; total: number; count: number }
    >();

    // Inicializar todos los días con 0
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyStats.set(dateKey, { date: dateKey, total: 0, count: 0 });
    }

    // Agregar datos reales
    sales.forEach((sale) => {
      const dateKey = sale.createdAt.toISOString().split('T')[0];
      const existing = dailyStats.get(dateKey);
      if (existing) {
        existing.total += Number(sale.total);
        existing.count += 1;
      }
    });

    return Array.from(dailyStats.values()).map((stat) => ({
      date: stat.date,
      total: stat.total.toFixed(2),
      count: stat.count,
    }));
  }

  /**
   * Obtiene top productos más vendidos en un rango
   * Reutilizable para diferentes períodos
   */
  async getTopProducts(
    dateFrom: Date,
    dateTo: Date,
    userId: number,
    limit: number = this.DEFAULT_TOP_PRODUCTS_LIMIT,
  ) {
    const sales = await this.getSalesInRange(dateFrom, dateTo, userId);
    return this.calculateTopProducts(sales, limit);
  }

  /**
   * Obtiene solo las estadísticas básicas de ventas en un rango
   */
  async getSalesStats(
    dateFrom: Date,
    dateTo: Date,
    userId: number,
  ): Promise<{ totalSales: number; transactionCount: number }> {
    const sales = await this.getSalesInRange(dateFrom, dateTo, userId);
    return this.calculateSalesStats(sales);
  }

  // ========================================
  // Métodos privados
  // ========================================

  /**
   * Calcula el rango de fechas basado en el filtro proporcionado
   */
  calculateDateRange(filterDto: SalesFilterDto): {
    dateFrom: Date;
    dateTo: Date;
  } {
    const now = new Date();

    if (filterDto.dateFrom && filterDto.dateTo) {
      // Rango personalizado
      return {
        dateFrom: startOfDay(new Date(filterDto.dateFrom)),
        dateTo: endOfDay(new Date(filterDto.dateTo)),
      };
    }

    if (filterDto.period) {
      // Según el periodo seleccionado
      switch (filterDto.period) {
        case PeriodType.DAILY:
          return {
            dateFrom: startOfDay(now),
            dateTo: endOfDay(now),
          };
        case PeriodType.WEEKLY:
          return {
            dateFrom: startOfWeek(now, { weekStartsOn: 1 }), // Lunes
            dateTo: endOfWeek(now, { weekStartsOn: 1 }),
          };
        case PeriodType.MONTHLY:
          return {
            dateFrom: startOfMonth(now),
            dateTo: endOfMonth(now),
          };
      }
    }

    // Por defecto: hoy
    return {
      dateFrom: startOfDay(now),
      dateTo: endOfDay(now),
    };
  }

  /**
   * Obtiene las ventas en un rango de fechas específico
   */
  private async getSalesInRange(
    dateFrom: Date,
    dateTo: Date,
    userId: number,
  ): Promise<Sale[]> {
    return this.saleRepository.find({
      where: {
        userId,
        createdAt: Between(dateFrom, dateTo),
      },
      relations: ['client', 'coupon', 'details'],
      order: { createdAt: 'DESC' },
    });
  }

  private calculateSalesStats(sales: Sale[]): {totalSales: number;
    transactionCount: number;
  } {
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    return {
      totalSales,
      transactionCount: sales.length,
    };
  }

  private calculateTopProducts(
    sales: Sale[],
    limit: number,
  ): Array<{ name: string; quantity: number; total: string }> {
    
    const productStats = new Map<
      number,
      { name: string; quantity: number; total: number }
    >();

    for (const sale of sales) {
      for (const detail of sale.details) {
        const existing = productStats.get(detail.productId);
        if (existing) {
          existing.quantity += detail.quantity;
          existing.total += Number(detail.subtotal);
        } else {
          productStats.set(detail.productId, {
            name: detail.productName,
            quantity: detail.quantity,
            total: Number(detail.subtotal),
          });
        }
      }
    }

    return Array.from(productStats.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit)
      .map((product) => ({
        name: product.name,
        quantity: product.quantity,
        total: product.total.toFixed(2),
      }));
  }

  /**
   * Obtiene el rango de fechas para el día actual
   */
  private getTodayRange() {
    const now = new Date();
    return {
      start: startOfDay(now),
      end: endOfDay(now),
    };
  }

  /**
   * Obtiene el rango de fechas para la semana actual
   */
  private getWeekRange() {
    const now = new Date();
    return {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    };
  }
}
