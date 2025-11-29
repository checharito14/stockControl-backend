import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ProductsService {
  private readonly DEFAULT_LOW_STOCK_THRESHOLD = 10;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto, userId: number) {
    const product = this.productRepository.create({
      ...createProductDto,
      userId
    })

    return await this.productRepository.save(product);
  }

  async findAll(userId: number) {
    return await this.productRepository.find({ where: { userId } });
  }

  async findOne(id: number, userId: number) {
    const product = await this.productRepository.findOneBy({ id, userId });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto, userId: number) {
    const product = await this.findOne(id, userId);

    Object.assign(product, updateProductDto);

    return await this.productRepository.save(product);
  }

  async remove(id: number, userId: number) {
    const product = await this.findOne(id, userId);

    await this.productRepository.remove(product);
    return {
      message: "Producto eliminado correctamente"
    }
  }

  async getLowStock(userId: number) {
    const products = await this.productRepository.find({
      where: { userId },
      order: { stock: 'ASC' },
    });

    return products.filter(product => product.stock <= this.DEFAULT_LOW_STOCK_THRESHOLD);
  }
}
