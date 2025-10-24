import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Client {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 100 })
    name: string;

    @Column('varchar', { length: 100 })
    lastName: string

    @Column('varchar', { length: 255, unique: true })
    email: string;

    @Column('varchar', { length: 10, unique: true })
    phone: string;

    @ManyToOne(() => User, (user) => user.clients)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'int' })
    userId: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

}
