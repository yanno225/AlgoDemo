import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Debat } from './debat.entity';
import { StatutResume } from '../enums/statut-resume.enum';

/**
 * Résumé d'un débat terminé (CDC §6.4) : généré par IA, validé par un humain,
 * puis publié dans le Feed (événement debat.resume.valide — contrat n°3).
 * Une ligne par génération (historique conservé).
 */
@Entity('resumes_debat')
export class ResumeDebat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Debat, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'debatId' })
  debat!: Debat;

  /** Brouillon produit par l'IA — jamais publié tel quel */
  @Column({ type: 'text' })
  texteGenereIA!: string;

  /** Version validée (éventuellement corrigée) par l'humain — publiée au Feed */
  @Column({ type: 'text', nullable: true })
  texteFinal!: string | null;

  @Column({
    type: 'enum',
    enum: StatutResume,
    default: StatutResume.EN_ATTENTE_VALIDATION,
  })
  statut!: StatutResume;

  /** Compte (modérateur/admin) ayant validé le résumé */
  @Column({ type: 'uuid', nullable: true })
  valideParUserId!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  dateGeneration!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  dateValidation!: Date | null;
}
