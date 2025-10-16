import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register-user.dto';
import { UsersService } from 'src/users/users.service';
import { comparePassword, hashPassword } from 'src/common/utils/utils';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.findOneByEmail(registerDto.email);

    if (user) {
      throw new BadRequestException('Ya existe un usuario con ese email');
    }

    const hashedPassword = await hashPassword(registerDto.password);
    
    await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      storeName: registerDto.storeName,
    })

     return { message: 'Usuario registrado correctamente' };
  }


  async login(loginDto: LoginDto) {

    const user = await this.usersService.findOneByEmail(loginDto.email);

    if(!user) {
      throw new BadRequestException('Credenciales inválidas');
    }

    const isPasswordValid = await comparePassword(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email };
    
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
    };
  }
}
