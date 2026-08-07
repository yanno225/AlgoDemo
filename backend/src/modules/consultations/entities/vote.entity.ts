import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ConsultationOption } from './consultation-option.entity';
import { Consultation } from './consultation.entity';

/** Vote unique sécurisé (1 vote/consultation, 2FA requis — CDC §6.3) */
@Entity('votes')
@Unique(['userId', 'consultation'])
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => Consultation, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultationId' })
  consultation!: Consultation;

  @ManyToOne(() => ConsultationOption, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'optionId' })
  option!: ConsultationOption;

  @CreateDateColumn({ name: 'vote_le' })
  voteLe!: Date;
}
