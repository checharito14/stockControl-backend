import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from './entities/sale.entity';
import { SaleDetail } from './entities/sale-detail.entity';
import { Product } from '../products/entities/product.entity';
import { Client } from '../clients/entities/client.entity';
import { Coupon } from '../coupons/entities/coupon.entity';

@Injectable()
export class SalesService {
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
    // Usar transacción para garantizar consistencia
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validar cliente (si se proporciona)
      if (createSaleDto.clientId) {
        const client = await this.clientRepository.findOne({
          where: { id: createSaleDto.clientId, userId },
        });

        if (!client) {
          throw new NotFoundException(
            `Cliente con ID ${createSaleDto.clientId} no encontrado`,
          );
        }
      }

      // 2. Validar cupón (si se proporciona)
      let coupon: Coupon | null = null;
      if (createSaleDto.couponId) {
        coupon = await this.couponRepository.findOne({
          where: { id: createSaleDto.couponId, userId },
        });

        if (!coupon) {
          throw new NotFoundException(
            `Cupón con ID ${createSaleDto.couponId} no encontrado`,
          );
        }

        // Validar que el cupón no esté expirado
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expirationDate = new Date(coupon.expirationDate);
        expirationDate.setHours(0, 0, 0, 0);

        if (expirationDate < today) {
          throw new BadRequestException(
            `El cupón "${coupon.name}" expiró el ${coupon.expirationDate}`,
          );
        }
      }

      // 3. Validar productos y stock
      const details: SaleDetail[] = [];
      let subtotal = 0;

      for (const detailDto of createSaleDto.details) {
        const product = await this.productRepository.findOne({
          where: { id: detailDto.productId, userId },
        });

        if (!product) {
          throw new NotFoundException(
            `Producto con ID ${detailDto.productId} no encontrado`,
          );
        }

        if (product.stock < detailDto.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${detailDto.quantity}`,
          );
        }

        // Crear detalle con snapshot de datos
        const detail = this.saleDetailRepository.create({
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: detailDto.quantity,
          subtotal: Number(product.price) * detailDto.quantity,
        });

        details.push(detail);
        subtotal += detail.subtotal;

        // Actualizar stock del producto
        product.stock -= detailDto.quantity;
        await queryRunner.manager.save(product);
      }

      // 4. Calcular descuento y total
      const discount = coupon
        ? (subtotal * coupon.discountPercentage) / 100
        : 0;
      const total = subtotal - discount;

      // 5. Crear la venta
      const sale = this.saleRepository.create({
        userId,
        clientId: createSaleDto.clientId || null,
        couponId: createSaleDto.couponId || null,
        subtotal,
        discount,
        total,
      });

      const savedSale = await queryRunner.manager.save(sale);

      // 6. Asignar saleId a los detalles y guardarlos
      details.forEach((detail) => {
        detail.saleId = savedSale.id;
      });
      await queryRunner.manager.save(details);

      // Commit de la transacción
      await queryRunner.commitTransaction();

      // Retornar la venta completa con detalles
      return this.findOne(savedSale.id, userId);
    } catch (error) {
      // Rollback en caso de error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberar el query runner
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
}
