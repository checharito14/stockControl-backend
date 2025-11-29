import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { SalesMetricsService } from './sales-metrics.service';
import { SalesController } from './sales.controller';
import { Sale } from './entities/sale.entity';
import { SaleDetail } from './entities/sale-detail.entity';
import { Product } from '../products/entities/product.entity';
import { Client } from '../clients/entities/client.entity';
import { Coupon } from '../coupons/entities/coupon.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleDetail, Product, Client, Coupon]),
  ],
  controllers: [SalesController],
  providers: [SalesService, SalesMetricsService],
  exports: [SalesService, SalesMetricsService],
})
export class SalesModule {}
