import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { IdValidationPipePipe } from 'src/common/pipes/id-validation-pipe/id-validation-pipe.pipe';
import { User } from '../auth/decorators/user.decorator';
import { JwtUser } from 'src/auth/interfaces/jwt-payload.interface';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  create(@Body() createCouponDto: CreateCouponDto, @User() user: JwtUser) {
    const userId = user.sub;
    return this.couponsService.create(createCouponDto, +userId);
  }

  @Get()
  findAll(@User() user: JwtUser) {
    return this.couponsService.findAll(+user.sub);
  }

  @Get(':id')
  findOne(
    @Param('id', IdValidationPipePipe) id: string,
    @User() user: JwtUser,
  ) {
    return this.couponsService.findOne(+id, +user.sub);
  }

  @Put(':id')
  update(
    @Param('id', IdValidationPipePipe) id: string,
    @Body() updateCouponDto: UpdateCouponDto,
    @User() user: JwtUser,
  ) {
    return this.couponsService.update(+id, updateCouponDto, +user.sub);
  }

  @Delete(':id')
  remove(@Param('id', IdValidationPipePipe) id: string, @User() user: JwtUser) {
    return this.couponsService.remove(+id, +user.sub);
  }
}
