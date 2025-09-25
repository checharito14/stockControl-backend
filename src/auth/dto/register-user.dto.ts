import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from "class-validator"

export class RegisterDto {

    @IsEmail({}, { message: "Debe ser un email válido" })
    @IsNotEmpty({ message: "El email es obligatorio" })
    email: string

    @IsString({ message: "La contraseña debe ser texto" })
    @IsNotEmpty({ message: "La contraseña es obligatoria" })
    @MinLength(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    @MaxLength(50, { message: "La contraseña no puede tener más de 50 caracteres" })
    password: string

    @IsString({ message: "El nombre de la tienda debe ser texto" })
    @IsNotEmpty({ message: "El nombre de la tienda es obligatorio" })
    @MinLength(2, { message: "El nombre de la tienda debe tener al menos 2 caracteres" })
    @MaxLength(100, { message: "El nombre de la tienda no puede tener más de 100 caracteres" })
    storeName: string
}
