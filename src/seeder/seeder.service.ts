import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/products/entities/product.entity';
import { Sale } from 'src/sales/entities/sale.entity';
import { SaleDetail } from 'src/sales/entities/sale-detail.entity';
import { Repository } from 'typeorm';

import { faker } from '@faker-js/faker';

@Injectable()
export class SeederService {

    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,

        @InjectRepository(Sale)
        private saleRepository: Repository<Sale>,
    ) {}

    async seed(userId: number) {

        await this.saleRepository.delete({ user: { id: userId } });
        await this.productRepository.delete({ user: { id: userId } });

        const products: Product[] = []

        // Crear productos
        for(let i = 0 ; i < 30; i++) {
            const product = this.productRepository.create({
                name: faker.commerce.productName(),
                price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
                stock: faker.number.int({ min: 5, max: 100 }),
                userId: userId,
                user: { id: userId }
            })
            products.push(await this.productRepository.save(product));
        }

        // Crear ventas
        for(let i = 0 ; i < 50; i++) {
            // Crear entre 1 y 4 productos por venta
            const numProducts = faker.number.int({ min: 1, max: 4 });
            const saleDetails: SaleDetail[] = [];
            let subtotal = 0;

            for(let j = 0; j < numProducts; j++) {
                const product = faker.helpers.arrayElement(products);
                const quantity = faker.number.int({ min: 1, max: 5 });
                const price = product.price;
                const detailSubtotal = price * quantity;

                const detail = new SaleDetail();
                detail.productId = product.id;
                detail.productName = product.name;
                detail.price = price;
                detail.quantity = quantity;
                detail.subtotal = detailSubtotal;
                detail.product = product;

                saleDetails.push(detail);
                subtotal += detailSubtotal;
            }

            // Aplicar descuento aleatorio (0-20%)
            const discountPercent = faker.number.float({ min: 0, max: 0.2, fractionDigits: 2 });
            const discount = subtotal * discountPercent;
            const total = subtotal - discount;

            const sale = this.saleRepository.create({
                userId: userId,
                clientId: null,
                couponId: null,
                subtotal: subtotal,
                discount: discount,
                total: total,
                createdAt: faker.date.recent({ days: 90 }),
                user: { id: userId },
                details: saleDetails
            });

            await this.saleRepository.save(sale);
        }

        console.log('✅ Seeding completed successfully!');
        console.log(`Created ${products.length} products and 50 sales for user ${userId}`);
    }
}
