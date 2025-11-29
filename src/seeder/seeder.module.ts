import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Product } from '../products/entities/product.entity';
import { Sale } from '../sales/entities/sale.entity';
import { SaleDetail } from '../sales/entities/sale-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Sale, SaleDetail])],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
