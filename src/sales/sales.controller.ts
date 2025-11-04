import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { User } from '../auth/decorators/user.decorator';
import { JwtUser } from 'src/auth/interfaces/jwt-payload.interface';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() createSaleDto: CreateSaleDto, @User() user: JwtUser) {
    return this.salesService.create(createSaleDto, +user.sub);
  }

  @Get()
  findAll(@User() user: JwtUser) {
    return this.salesService.findAll(+user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() user: JwtUser  ) {
    return this.salesService.findOne(+id, +user.sub);
  }
}
