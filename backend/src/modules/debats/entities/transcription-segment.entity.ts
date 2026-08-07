import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Debat } from './debat.entity';

/**
 * Segment de transcription en direct d'un débat : une portion de ce qu'un
 * intervenant a dit, convertie en texte par son navigateur (reconnaissance
 * vocale) et remontée pendant le live. Assemblés dans l'ordre, les segments
 * forment le verbatim du débat — matière première du résumé IA (le résumé ne
 * se base QUE là-dessus + les votes, il n'invente rien).
 */
@Entity('transcription_segments')
@Index(['debat', 'creeLe'])
export class TranscriptionSegment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Debat, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'debatId' })
  debat!: Debat;

  /** Compte de l'intervenant qui a parlé */
  @Column({ type: 'uuid' })
  userId!: string;

  /** Nom/email affiché de l'intervenant (figé au moment de la parole) */
  @Column({ length: 255 })
  intervenant!: string;

  @Column({ type: 'text' })
  texte!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  creeLe!: Date;
}
