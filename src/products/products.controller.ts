import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IdValidationPipePipe } from 'src/common/pipes/id-validation-pipe/id-validation-pipe.pipe';
import { User } from '../auth/decorators/user.decorator';
import { JwtUser } from 'src/auth/interfaces/jwt-payload.interface';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto, @User() user: JwtUser) {
    const userId = user.sub;
    return this.productsService.create(createProductDto, +userId);
  }

  @Get()
  findAll(@User() user: JwtUser) {
    return this.productsService.findAll(+user.sub);
  }

  @Get('low-stock')
  getLowStock(@User() user: JwtUser) {
    return this.productsService.getLowStock(+user.sub);
  }

  @Get(':id')
  findOne(
    @Param('id', IdValidationPipePipe) id: string,
    @User() user: JwtUser,
  ) {
    return this.productsService.findOne(+id, +user.sub);
  }

  @Put(':id')
  update(
    @Param('id', IdValidationPipePipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @User() user: JwtUser,
  ) {
    return this.productsService.update(+id, updateProductDto, +user.sub);
  }

  @Delete(':id')
  remove(@Param('id', IdValidationPipePipe) id: string, @User() user: JwtUser) {
    return this.productsService.remove(+id, +user.sub);
  }
}
