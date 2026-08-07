import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Critere } from './critere.entity';

/**
 * Indicateur mesurable rattaché à un critère (CDC §5).
 * Les valeurs mesurées (ValeurIndicateur : valeur, dateMesure, paysOuZone,
 * source) seront portées par le futur module Fiche-pays — pas ici.
 */
@Entity('indicateurs')
@Unique(['libelle', 'critere'])
export class Indicateur {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 500 })
  libelle!: string;

  /** Supprimer un critère supprime ses indicateurs (cascade en base) */
  @ManyToOne(() => Critere, (critere) => critere.indicateurs, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'critereId' })
  critere!: Critere;
}
