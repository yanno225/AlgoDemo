import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StatutSignalement } from '../enums/statut-signalement.enum';
import { Contenu } from './contenu.entity';

/**
 * Signalement d'un contenu par un utilisateur (fausse information, contenu
 * inapproprié...) — alimente la file de modération unifiée du back-office (§3.10).
 * `signalePar`/`traiteParUserId` référencent un `User` (module Auth) par
 * identifiant uniquement (modules découplés).
 */
@Entity('signalements')
export class Signalement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Contenu, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contenuId' })
  contenu!: Contenu;

  @Column({ name: 'signale_par', type: 'uuid' })
  signalePar!: string;

  @Column({ type: 'text' })
  motif!: string;

  @Column({
    type: 'enum',
    enum: StatutSignalement,
    default: StatutSignalement.EN_ATTENTE,
  })
  statut!: StatutSignalement;

  @Column({ name: 'traite_par_user_id', type: 'uuid', nullable: true })
  traiteParUserId?: string | null;

  @Column({ name: 'traite_le', type: 'timestamptz', nullable: true })
  traiteLe?: Date | null;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe!: Date;
}
