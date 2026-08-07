import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StatutSignalement } from '../enums/debats.enums';
import { Debat } from './debat.entity';

/**
 * Signalement en direct d'une fausse information pendant le live
 * (CDC §6.4 : « vérification immédiate »). Reçu en temps réel par les
 * modérateurs/staff, traité pendant ou après la session.
 */
@Entity('signalements_debat')
export class SignalementDebat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Debat, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'debatId' })
  debat!: Debat;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ length: 500 })
  message!: string;

  @Column({
    type: 'enum',
    enum: StatutSignalement,
    default: StatutSignalement.EN_ATTENTE,
  })
  statut!: StatutSignalement;

  @CreateDateColumn({ type: 'timestamptz' })
  creeLe!: Date;
}
