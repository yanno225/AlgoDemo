import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Debat } from './debat.entity';

/**
 * Message du fil de discussion d'un live (CDC §6.4 : la salle échange pendant
 * le débat). Publié immédiatement, modéré a posteriori par le staff.
 *
 * La modération MASQUE (supprimeLe/supprimePar) au lieu d'effacer : le contenu
 * reste tracé pour un éventuel audit, mais ne quitte plus jamais le serveur.
 * Le nom d'auteur n'est jamais stocké — résolu à la lecture depuis `users`,
 * ce qui rend l'anonymisation (RG-USR-07) rétroactive.
 */
@Entity('messages_debat')
export class MessageDebat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Debat, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'debatId' })
  debat!: Debat;

  /** Référence au compte (module Auth — pas de relation TypeORM, découplage). */
  @Column({ type: 'uuid' })
  auteurId!: string;

  @Column({ length: 500 })
  texte!: string;

  @Column({ type: 'timestamptz', nullable: true })
  supprimeLe!: Date | null;

  /** Qui a masqué le message (staff) — traçabilité de la modération. */
  @Column({ type: 'uuid', nullable: true })
  supprimePar!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  creeLe!: Date;
}
