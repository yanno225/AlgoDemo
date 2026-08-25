import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Thematique } from '../../referentiel/entities/thematique.entity';
import { StatutVerification } from '../enums/statut-verification.enum';
import { TypeContenu } from '../enums/type-contenu.enum';
import { CommentaireContenu } from './commentaire-contenu.entity';
import { ReactionContenu } from './reaction-contenu.entity';

/**
 * Contenu publié dans le feed (CDC §6.1) : article, fiche ou vidéo, rattaché
 * à une thématique du Référentiel. `auteurId` référence un `User` (module Auth)
 * par identifiant uniquement — pas de relation TypeORM directe, pour ne pas
 * coupler les modules (architecture par IDs stables + événements).
 */
@Entity('contenus')
export class Contenu {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  titre!: string;

  /** Corps textuel — support de la lecture audio TTS (§7.1) */
  @Column({ type: 'text' })
  corps!: string;

  @Column({ type: 'enum', enum: TypeContenu })
  type!: TypeContenu;

  @Column({
    name: 'statut_verification',
    type: 'enum',
    enum: StatutVerification,
    default: StatutVerification.NON_VERIFIE,
  })
  statutVerification!: StatutVerification;

  @Column({ name: 'est_officiel', default: false })
  estOfficiel!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  source?: string | null;

  @Column({ name: 'url_media', type: 'varchar', length: 1000, nullable: true })
  urlMedia?: string | null;

  /** Générée par le futur MediaService/TTS partagé (voir TtsService, encore un stub) */
  @Column({ name: 'url_audio', type: 'varchar', length: 1000, nullable: true })
  urlAudio?: string | null;

  /** Mode hors-ligne (§9.4) : inclus dans le package téléchargeable du feed */
  @Column({ default: false })
  telechargeable!: boolean;

  @Index()
  @Column({ name: 'est_publie', default: false })
  estPublie!: boolean;

  @Column({ name: 'publie_le', type: 'timestamptz', nullable: true })
  publieLe?: Date | null;

  /** Empêche la suppression d'une thématique tant que du contenu y est rattaché */
  @ManyToOne(() => Thematique, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'thematiqueId' })
  thematique!: Thematique;

  @Column({ name: 'auteur_id', type: 'uuid' })
  auteurId!: string;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe!: Date;

  @UpdateDateColumn({ name: 'maj_le' })
  majLe!: Date;

  // ─── Interactions citoyennes (§6.2) ────────────────────────────────
  // Relations déclarées pour compter via loadRelationCountAndMap — les
  // lignes elles-mêmes ne sont jamais chargées avec le contenu.

  @OneToMany(() => ReactionContenu, (reaction) => reaction.contenu)
  reactions!: ReactionContenu[];

  @OneToMany(() => CommentaireContenu, (commentaire) => commentaire.contenu)
  commentaires!: CommentaireContenu[];

  /** Renseignés à la lecture par les compteurs — jamais stockés. */
  nombreReactions?: number;
  nombreCommentaires?: number;
}
