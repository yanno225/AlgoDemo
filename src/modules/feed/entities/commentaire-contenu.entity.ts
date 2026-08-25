import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Contenu } from './contenu.entity';

/**
 * Commentaire citoyen sous un contenu du feed (§6.2).
 *
 * Publié immédiatement (une pré-modération tuerait la conversation) ;
 * la modération est a posteriori : suppression réservée aux gestionnaires
 * (POINT_FOCAL, ADMIN) depuis le back-office.
 *
 * `auteurId` référence un `User` par identifiant nu (modules découplés) —
 * le nom affiché est résolu à la lecture, jamais figé ici : un compte
 * anonymisé (RG-USR-07) ne doit plus voir son nom apparaître.
 */
@Entity('commentaires_contenu')
export class CommentaireContenu {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'auteur_id', type: 'uuid' })
  auteurId!: string;

  @ManyToOne(() => Contenu, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contenuId' })
  contenu!: Contenu;

  @Column({ type: 'text' })
  texte!: string;

  /**
   * Réponse à un autre commentaire (fil à UN niveau, comme sur TikTok :
   * répondre à une réponse rattache au commentaire racine). Identifiant nu,
   * la suppression du parent emporte ses réponses (cascade en base).
   */
  @Index()
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe!: Date;
}
