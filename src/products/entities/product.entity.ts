import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

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
    
    @Column({type: 'int'})
    userId: number
    
    @ManyToOne(() => User, (user) => user.products, { 
        onDelete: 'CASCADE',
        nullable: false 
    })

    @JoinColumn({ name: 'userId' }) 
    user: User;

}
