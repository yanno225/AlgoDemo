import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AffirmationDebat } from './affirmation-debat.entity';

/**
 * Vote en direct d'un participant sur une affirmation : valide (vrai) ou
 * invalide (faux). Un seul vote par (affirmation, utilisateur) — revoter
 * remplace le vote précédent tant que l'affirmation est ouverte.
 */
@Entity('votes_affirmation')
@Unique(['affirmation', 'userId'])
export class VoteAffirmation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AffirmationDebat, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'affirmationId' })
  affirmation!: AffirmationDebat;

  @Column({ type: 'uuid' })
  userId!: string;

  /** true = l'affirmation est validée par ce participant ; false = invalidée */
  @Column()
  valide!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  voteLe!: Date;
}
