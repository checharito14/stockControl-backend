import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesFilterDto, PeriodType } from './dto/sales-filter.dto';
import { Sale } from './entities/sale.entity';
import { SaleDetail } from './entities/sale-detail.entity';
import { Product } from '../products/entities/product.entity';
import { Client } from '../clients/entities/client.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class SalesService {
  // Constantes para evitar magic numbers
  private readonly PERCENTAGE_DIVISOR = 100;
  private readonly DEFAULT_TOP_PRODUCTS_LIMIT = 5;

  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleDetail)
    private readonly saleDetailRepository: Repository<SaleDetail>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createSaleDto: CreateSaleDto, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.validateClient(createSaleDto.clientId, userId);
      const coupon = await this.validateCoupon(createSaleDto.couponId, userId);
      const { details, subtotal } = await this.processProductDetails(
        createSaleDto.details,
        userId,
        queryRunner,
      );

      const discount = this.calculateDiscount(subtotal, coupon);
      const total = subtotal - discount;

      const sale = await this.createSaleRecord(
        userId,
        createSaleDto,
        subtotal,
        discount,
        total,
        queryRunner,
      );

      await this.saveSaleDetails(details, sale.id, queryRunner);

      await queryRunner.commitTransaction();
      return this.findOne(sale.id, userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(userId: number) {
    return this.saleRepository.find({
      where: { userId },
      relations: ['client', 'coupon', 'details', 'details.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const sale = await this.saleRepository.findOne({
      where: { id, userId },
      relations: ['client', 'coupon', 'details', 'details.product'],
    });

    if (!sale) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    return sale;
  }

  // ========================================
  // Métodos privados para refactorización de create()
  // ========================================

  /**
   * Valida que el cliente exista y pertenezca al usuario
   */
  private async validateClient(
    clientId: number | undefined,
    userId: number,
  ): Promise<void> {
    if (!clientId) return;

    const client = await this.clientRepository.findOne({
      where: { id: clientId, userId },
    });

    if (!client) {
      throw new NotFoundException(
        `Cliente con ID ${clientId} no encontrado`,
      );
    }
  }

  /**
   * Valida que el cupón exista, pertenezca al usuario y no esté expirado
   */
  private async validateCoupon(
    couponId: number | undefined,
    userId: number,
  ): Promise<Coupon | null> {
    if (!couponId) return null;

    const coupon = await this.couponRepository.findOne({
      where: { id: couponId, userId },
    });

    if (!coupon) {
      throw new NotFoundException(`Cupón con ID ${couponId} no encontrado`);
    }

    this.validateCouponExpiration(coupon);
    return coupon;
  }

  /**
   * Verifica que el cupón no esté expirado
   */
  private validateCouponExpiration(coupon: Coupon): void {
    const today = startOfDay(new Date());
    const expirationDate = startOfDay(new Date(coupon.expirationDate));

    if (expirationDate < today) {
      throw new BadRequestException(
        `El cupón "${coupon.name}" expiró el ${coupon.expirationDate}`,
      );
    }
  }

  /**
   * Procesa los detalles de productos, valida stock y actualiza inventario
   */
  private async processProductDetails(
    detailsDto: CreateSaleDto['details'],
    userId: number,
    queryRunner: any,
  ): Promise<{ details: SaleDetail[]; subtotal: number }> {
    const details: SaleDetail[] = [];
    let subtotal = 0;

    for (const detailDto of detailsDto) {
      const product = await this.validateProductStock(
        detailDto.productId,
        detailDto.quantity,
        userId,
      );

      const detail = this.createSaleDetail(product, detailDto.quantity);
      details.push(detail);
      subtotal += detail.subtotal;

      await this.updateProductStock(product, detailDto.quantity, queryRunner);
    }

    return { details, subtotal };
  }

  /**
   * Valida que el producto exista y tenga stock suficiente
   */
  private async validateProductStock(
    productId: number,
    quantity: number,
    userId: number,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId, userId },
    });

    if (!product) {
      throw new NotFoundException(
        `Producto con ID ${productId} no encontrado`,
      );
    }

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${quantity}`,
      );
    }

    return product;
  }

  /**
   * Crea un detalle de venta con snapshot de datos del producto
   */
  private createSaleDetail(product: Product, quantity: number): SaleDetail {
    return this.saleDetailRepository.create({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity,
      subtotal: Number(product.price) * quantity,
    });
  }

  /**
   * Actualiza el stock del producto restando la cantidad vendida
   */
  private async updateProductStock(
    product: Product,
    quantity: number,
    queryRunner: any,
  ): Promise<void> {
    product.stock -= quantity;
    await queryRunner.manager.save(product);
  }

  /**
   * Calcula el descuento aplicando el porcentaje del cupón
   */
  private calculateDiscount(subtotal: number, coupon: Coupon | null): number {
    if (!coupon) return 0;
    return (subtotal * coupon.discountPercentage) / this.PERCENTAGE_DIVISOR;
  }

  /**
   * Crea el registro de venta con los totales calculados
   */
  private async createSaleRecord(
    userId: number,
    createSaleDto: CreateSaleDto,
    subtotal: number,
    discount: number,
    total: number,
    queryRunner: any,
  ): Promise<Sale> {
    const sale = this.saleRepository.create({
      userId,
      clientId: createSaleDto.clientId || null,
      couponId: createSaleDto.couponId || null,
      subtotal,
      discount,
      total,
    });

    return queryRunner.manager.save(sale);
  }

  /**
   * Guarda los detalles de venta asociándolos con la venta
   */
  private async saveSaleDetails(
    details: SaleDetail[],
    saleId: number,
    queryRunner: any,
  ): Promise<void> {
    details.forEach((detail) => {
      detail.saleId = saleId;
    });
    await queryRunner.manager.save(details);
  }
}
