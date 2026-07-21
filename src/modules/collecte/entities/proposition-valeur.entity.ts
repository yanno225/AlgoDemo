import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Indicateur } from '../../referentiel/entities/indicateur.entity';
import { StatutProposition } from '../enums/statut-proposition.enum';

/**
 * Valeur d'indicateur PROPOSÉE par la collecte automatique (API de données
 * ouvertes ou extraction IA), en attente de validation humaine avant d'entrer
 * dans la Fiche-pays (table valeurs_indicateurs).
 *
 * Unicité (indicateur, pays, date, source) : un même job relancé ne recrée pas
 * de doublon de proposition.
 */
@Entity('propositions_valeur')
@Unique(['indicateur', 'paysOuZone', 'dateMesure', 'source'])
@Index(['statut'])
export class PropositionValeur {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Indicateur, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'indicateurId' })
  indicateur!: Indicateur;

  @Column({ type: 'double precision' })
  valeur!: number;

  @Column({ type: 'date' })
  dateMesure!: string;

  @Column({ length: 100 })
  paysOuZone!: string;

  /** Provenance (ex. « Banque Mondiale — EG.ELC.ACCS.ZS » ou l'URL de l'article) */
  @Column({ length: 500 })
  source!: string;

  @Column({
    type: 'enum',
    enum: StatutProposition,
    default: StatutProposition.EN_ATTENTE,
  })
  statut!: StatutProposition;

  @CreateDateColumn({ type: 'timestamptz' })
  collecteLe!: Date;
}
