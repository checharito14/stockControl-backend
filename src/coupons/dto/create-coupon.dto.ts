import { IsNotEmpty, IsString, IsDateString, IsInt, Min, Max } from "class-validator";

export class CreateCouponDto {
    
    @IsNotEmpty({message: 'El nombre es obligatorio'})
    @IsString({message: "Nombre no válido"})
    name: string;

    @IsNotEmpty({message: 'La fecha de expiración es obligatoria'})
    @IsDateString({}, {message: 'Fecha de expiración no válida'})
    expirationDate: Date;

    @IsNotEmpty({message: 'El porcentaje de descuento es obligatorio'})
    @IsInt({message: 'El descuento debe ser un número entero'})
    @Min(0, {message: 'El descuento debe ser mayor o igual a 0'})
    @Max(100, {message: 'El descuento no puede ser mayor a 100'})
    discountPercentage: number;
}
