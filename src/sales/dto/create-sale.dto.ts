import { Type } from 'class-transformer';
import {
    ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

export class SaleDetailDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateSaleDto {
  @IsOptional()
  @IsNumber()
  clientId?: number;

  @IsOptional()
  @IsNumber()
  couponId?: number;

  @IsArray({ message: 'La venta debe contener al menos un producto' })
  @ArrayNotEmpty({ message: 'La venta no puede estar vacía' })
  @ValidateNested({ each: true })
  @Type(() => SaleDetailDto)
  details: SaleDetailDto[];
}
