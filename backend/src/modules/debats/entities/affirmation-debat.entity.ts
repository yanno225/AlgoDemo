import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StatutAffirmation } from '../enums/debats.enums';
import { Debat } from './debat.entity';

/**
 * Affirmation énoncée pendant le live et soumise au vote en direct
 * (CDC §6.4 : « valider ou invalider une affirmation »).
 * Le modérateur l'ouvre, la salle vote, le modérateur la ferme.
 */
@Entity('affirmations_debat')
export class AffirmationDebat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Debat, (d) => d.affirmations, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'debatId' })
  debat!: Debat;

  @Column({ length: 500 })
  texte!: string;

  @Column({
    type: 'enum',
    enum: StatutAffirmation,
    default: StatutAffirmation.OUVERTE,
  })
  statut!: StatutAffirmation;

  @CreateDateColumn({ type: 'timestamptz' })
  creeLe!: Date;
}
