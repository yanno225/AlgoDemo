import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Thematique } from '../../referentiel/entities/thematique.entity';
import { StatutDebat } from '../enums/debats.enums';
import { AffirmationDebat } from './affirmation-debat.entity';

/**
 * Débat citoyen encadré (CDC §6.4) : session live thématique avec modérateur
 * désigné, votes en direct sur des affirmations, signalements, puis replay.
 */
@Entity('debats')
export class Debat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  titre!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: StatutDebat, default: StatutDebat.PLANIFIE })
  statut!: StatutDebat;

  /** Date/heure planifiée du live */
  @Column({ type: 'timestamptz' })
  dateDebut!: Date;

  /** Renseignée à la clôture, pour l'archive consultable (CDC : urlReplay) */
  @Column({ type: 'varchar', length: 500, nullable: true })
  urlReplay!: string | null;

  /** Compte (point focal/admin) désigné modérateur du live */
  @Column({ type: 'uuid', nullable: true })
  moderateurId!: string | null;

  /** Rattachement à une des 5 thématiques du Référentiel */
  @ManyToOne(() => Thematique, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'thematiqueId' })
  thematique!: Thematique;

  @OneToMany(() => AffirmationDebat, (a) => a.debat)
  affirmations!: AffirmationDebat[];

  @CreateDateColumn({ type: 'timestamptz' })
  creeLe!: Date;
}
