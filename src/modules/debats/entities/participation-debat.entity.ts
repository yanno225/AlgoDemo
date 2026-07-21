import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { RoleParticipation } from '../enums/debats.enums';
import { Debat } from './debat.entity';

/**
 * Trace de participation d'un utilisateur à un débat (CDC : ParticipationDebat).
 * Créée au premier « rejoindre » du live ; une seule par (débat, utilisateur).
 */
@Entity('participations_debat')
@Unique(['debat', 'userId'])
export class ParticipationDebat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Debat, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'debatId' })
  debat!: Debat;

  /** Référence au compte (module Auth — pas de relation TypeORM pour rester découplé) */
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: RoleParticipation,
    default: RoleParticipation.SPECTATEUR,
  })
  role!: RoleParticipation;

  @CreateDateColumn({ type: 'timestamptz' })
  rejointLe!: Date;
}
