import { IsEmail, IsNotEmpty, IsString, Length, Matches, IsOptional } from "class-validator";

export class CreateClientDto {

    @IsNotEmpty({message: 'El nombre es obligatorio'})
    @IsString({message: "Nombre no válido"})
    @Length(2, 100, {message: 'El nombre debe tener entre 2 y 100 caracteres'})
    name: string;

    @IsNotEmpty({message: 'El apellido es obligatorio'})
    @IsString({message: "Apellido no válido"})
    @Length(2, 100, {message: 'El apellido debe tener entre 2 y 100 caracteres'})
    lastName: string;

    @IsString({message: 'El teléfono debe ser texto'})
    @Matches(/^[0-9]{10}$/, {message: 'El teléfono debe tener exactamente 10 dígitos'})
    phone: string;

    @IsNotEmpty({message: 'El email es obligatorio'})
    @IsEmail({}, {message: 'Email no válido'})
    email: string;

}
