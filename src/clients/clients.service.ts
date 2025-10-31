import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(
    createClientDto: CreateClientDto,
    userId: number,
  ): Promise<Client> {
    const { email, phone } = createClientDto;

    const phoneExists = await this.clientRepository.findOne({
      where: { phone, userId },
    });

    if (phoneExists) {
      throw new BadRequestException(
        'El teléfono ya está registrado en otro cliente.',
      );
    }

    const emailExists = await this.clientRepository.findOne({
      where: { email, userId},
    });
    if (emailExists) {
      throw new BadRequestException(
        'El correo electrónico ya está registrado en otro cliente.',
      );
    }

    const client = this.clientRepository.create({
      ...createClientDto,
      userId,
    });

    return await this.clientRepository.save(client);
  }

  async findAll(userId: number): Promise<Client[]> {
    return await this.clientRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id, userId },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return client;
  }

  async update(
    id: number,
    updateClientDto: UpdateClientDto,
    userId: number,
  ): Promise<Client> {
    const client = await this.findOne(id, userId);

    try {
      Object.assign(client, updateClientDto);
      return await this.clientRepository.save(client);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException(
          'El email o teléfono ya están registrados',
        );
      }
      throw error;
    }
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    const client = await this.findOne(id, userId);
    await this.clientRepository.remove(client);
    return {
      message: 'Cliente eliminado correctamente',
    };
  }
}
