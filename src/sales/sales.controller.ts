import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesMetricsService } from './sales-metrics.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesFilterDto } from './dto/sales-filter.dto';
import { User } from '../auth/decorators/user.decorator';
import { JwtUser } from 'src/auth/interfaces/jwt-payload.interface';
import { IdValidationPipePipe } from 'src/common/pipes/id-validation-pipe/id-validation-pipe.pipe';

@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly metricsService: SalesMetricsService,
  ) {}

  @Post()
  create(@Body() createSaleDto: CreateSaleDto, @User() user: JwtUser) {
    return this.salesService.create(createSaleDto, +user.sub);
  }

  @Get()
  findAll(@User() user: JwtUser) {
    return this.salesService.findAll(+user.sub);
  }

  @Get('history')
  getHistory(@Query() filterDto: SalesFilterDto, @User() user: JwtUser) {
    return this.metricsService.getHistory(filterDto, +user.sub);
  }

  @Get('dashboard/metrics')
  getDashboardMetrics(@User() user: JwtUser) {
    return this.metricsService.getDashboardMetrics(+user.sub);
  }

  @Get('dashboard/activity')
  getLast30DaysActivity(@User() user: JwtUser) {
    return this.metricsService.getLast30DaysActivity(+user.sub);
  }

  @Get('top-products')
  getTopProducts(@Query() filterDto: SalesFilterDto, @User() user: JwtUser) {
    const { dateFrom, dateTo } = this.metricsService.calculateDateRange(filterDto);
    return this.metricsService.getTopProducts(dateFrom, dateTo, +user.sub);
  }

  @Get(':id')
  findOne(
    @Param('id', IdValidationPipePipe) id: string,
    @User() user: JwtUser,
  ) {
    return this.salesService.findOne(+id, +user.sub);
  }
}
