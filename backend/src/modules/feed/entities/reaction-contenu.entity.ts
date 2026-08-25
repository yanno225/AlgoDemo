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
import { Contenu } from './contenu.entity';

/**
 * « J'aime » d'un citoyen sur un contenu du feed (format immersif, §6.2).
 * Une réaction par personne et par contenu — re-liker retire la réaction
 * (bascule), comme sur les plateformes que les citoyens connaissent déjà.
 */
@Entity('reactions_contenu')
@Unique(['userId', 'contenu'])
export class ReactionContenu {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => Contenu, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contenuId' })
  contenu!: Contenu;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe!: Date;
}
