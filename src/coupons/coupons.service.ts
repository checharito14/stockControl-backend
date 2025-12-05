import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Coupon } from './entities/coupon.entity';
import { ClientsService } from '../clients/clients.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    private clientsService: ClientsService,
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

  async create(createCouponDto: CreateCouponDto, userId: number) {
    const existingCoupon = await this.couponRepository.findOneBy({ 
      name: createCouponDto.name, 
      userId 
    });

    if (existingCoupon) {
      throw new ConflictException('Ya existe un cupón con ese nombre');
    }

    const coupon = this.couponRepository.create({
      ...createCouponDto,
      userId,
    });
    
    const savedCoupon = await this.couponRepository.save(coupon);

    this.sendCouponEmails(savedCoupon, userId).catch(error => {
      console.error('Error enviando emails de cupón:', error);
    });

    return savedCoupon;
  }

  private async sendCouponEmails(coupon: Coupon, userId: number): Promise<void> {
    try {
      const clients = await this.clientsService.findAll(userId);
      const user = await this.usersService.findOne(userId);
      
      if (clients.length > 0 && user) {
        await this.emailService.sendCouponNotification(clients, coupon, user);
      }
    } catch (error) {
      console.error('Error en sendCouponEmails:', error);
      throw error;
    }
  }

  findAll(userId: number) {
    return this.couponRepository.find({
      where: { userId },
    });
  }

  async findOne(id: number, userId: number) {
    const coupon = await this.couponRepository.findOneBy({ id, userId });
    
    if (!coupon) {
      throw new NotFoundException('Cupón no encontrado');
    }
    
    return coupon;
  }

  async update(id: number, updateCouponDto: UpdateCouponDto, userId: number) {
    const coupon = await this.findOne(id, userId);
    
    Object.assign(coupon, updateCouponDto);
    
    return this.couponRepository.save(coupon);
  }

  async remove(id: number, userId: number) {
    const coupon = await this.findOne(id, userId);
    return this.couponRepository.remove(coupon);
  }
}
