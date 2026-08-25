import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  Column,
} from 'typeorm';
import { CommentaireContenu } from './commentaire-contenu.entity';

/**
 * « J'aime » sur un commentaire du feed — bascule, une seule réaction par
 * personne et par commentaire (même modèle que les réactions aux contenus).
 */
@Entity('reactions_commentaire')
@Unique(['userId', 'commentaire'])
export class ReactionCommentaire {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => CommentaireContenu, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentaireId' })
  commentaire!: CommentaireContenu;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe!: Date;
}
