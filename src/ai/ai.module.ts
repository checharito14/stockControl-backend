import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AIService } from './ai.service';
import { OpenAIService } from './openai.service';
import { AIInsight } from './entities/ai-insight.entity';
import { Sale } from '../sales/entities/sale.entity';
import { SaleDetail } from '../sales/entities/sale-detail.entity';
import { Product } from '../products/entities/product.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AIInsight,
      Sale,
      SaleDetail,
      Product,
      Coupon,
      User,
    ]),
    ScheduleModule.forRoot(),
    ConfigModule,
  ],
  controllers: [AiController],
  providers: [AIService, OpenAIService],
  exports: [AIService],
})
export class AiModule {}
