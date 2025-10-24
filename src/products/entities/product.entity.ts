import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar', length: 600})
    name: string;

    @Column({type: 'decimal'})
    price: number;

    @Column({ type: 'int' })
    stock: number;

    @ManyToMany(() => User, (user) => user.products)
    @JoinColumn({ name: 'userId' }) 
    user: User;

    @Column({type: 'int'})
    userId: number
}
