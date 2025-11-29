import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['weekly', 'monthly'],
  })
  type: 'weekly' | 'monthly';

  @Column()
  year: number;

  @Column()
  period: number; // Número de semana (1-53) o mes (1-12)

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column()
  s3Key: string; // Ruta en S3: reports/{userId}/{type}/{year}/{period}.pdf

  @Column({ nullable: true })
  s3Url: string; // URL firmada para descarga (temporal)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalSales: number;

  @Column()
  transactionCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  averageTicket: number; // Ticket promedio

  @CreateDateColumn()
  generatedAt: Date;
}
