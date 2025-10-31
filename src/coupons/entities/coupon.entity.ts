import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Coupon {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar', length: 255, unique: true})
    name: string;

    @Column({type: 'date'})
    expirationDate: Date;

    @Column({type: 'int'})
    discountPercentage: number;
    
    @Column({type: 'int'})
    userId: number;
    
    @ManyToOne(() => User, (user) => user.coupons, { 
        onDelete: 'CASCADE',
        nullable: false 
    })
    @JoinColumn({ name: 'userId' }) 
    user: User;
}
