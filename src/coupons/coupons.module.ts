import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { Coupon } from './entities/coupon.entity';
import { ClientsModule } from 'src/clients/clients.module';
import { EmailModule } from 'src/email/email.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coupon]),
    ClientsModule,
    EmailModule,
    UsersModule,
  ],
  controllers: [CouponsController],
  providers: [CouponsService],
})
export class CouponsModule {}
