import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Coupon } from './entities/coupon.entity';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
  ) {}

  async create(createCouponDto: CreateCouponDto, userId: number) {

    const existingCoupon =  await this.couponRepository.findOneBy({ name: createCouponDto.name, userId });

    if (existingCoupon) {
      throw new ConflictException('Ya existe un cupón con ese nombre');
    }

    const coupon = this.couponRepository.create({
      ...createCouponDto,
      userId,
    });
    return this.couponRepository.save(coupon);
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
    
    await this.couponRepository.remove(coupon);
    
    return { message: 'Cupón eliminado correctamente' };
  }
}
