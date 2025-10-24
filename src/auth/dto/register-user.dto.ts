import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from "class-validator"

export class RegisterDto {

    @IsEmail({}, { message: "Debe ser un email válido" })
    @IsNotEmpty({ message: "El email es obligatorio" })
    email: string

    @IsString({ message: "La contraseña debe ser texto" })
    @IsNotEmpty({ message: "La contraseña es obligatoria" })
    @MinLength(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    password: string

    @IsNotEmpty({ message: "El nombre de la tienda es obligatorio" })
    storeName: string
}
