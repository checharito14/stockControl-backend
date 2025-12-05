import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export interface InsightData {
  description: string;
}

@Entity()
@Index(['userId'], { unique: true })
export class AIInsight {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'json' })
  insights: InsightData[];

  @CreateDateColumn()
  generatedAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;
}
