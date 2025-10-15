import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateProductDto {
    
    @IsNotEmpty({message: 'El nombre es obligatorio'})
     @IsString({message: "Nombre no válido"})
    name: string;

    @IsNotEmpty({message: 'El precio es obligatorio'})
    @IsNumber({maxDecimalPlaces: 2}, {message: 'Precio no válido'})
    price: number;

    @IsNotEmpty({message: 'El stock es obligatorio'})
    @IsNumber({}, {message: 'Numero de stock no válido'})
    stock: number;
}
