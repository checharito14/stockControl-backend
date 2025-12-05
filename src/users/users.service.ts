import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    create(createUserDto: CreateUserDto) {
        return this.userRepository.save(createUserDto)
    }

    findOne(id: number) {
        return this.userRepository.findOneBy({ id });
    }

    findOneByEmail(email: string) {
        return this.userRepository.findOneBy({ email });
    }
}
