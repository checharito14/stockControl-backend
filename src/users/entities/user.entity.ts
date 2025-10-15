import { Product } from "src/products/entities/product.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 100, unique: true})
    email: string

    @Column({ type: 'varchar'})
    password: string

    @Column({ type: 'varchar', length: 50})
    storeName: string

    @OneToMany(() => Product, (product) => product.user)
    products: Product[];    
}