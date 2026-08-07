import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Thematique } from '../../referentiel/entities/thematique.entity';
import { StatutModeration } from '../enums/statut-moderation.enum';

/**
 * Avis écrit d'un citoyen, rattaché à une thématique du Référentiel (CDC §6.2).
 * Passe en modération (`statutModeration`) avant toute publication.
 * `auteurId`/`modereParUserId` référencent un `User` (module Auth) par
 * identifiant uniquement — pas de relation TypeORM directe (modules découplés).
 */
@Entity('avis')
export class Avis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  texte!: string;

  @ManyToOne(() => Thematique, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'thematiqueId' })
  thematique!: Thematique;

  @Column({ name: 'auteur_id', type: 'uuid' })
  auteurId!: string;

  @Column({
    name: 'statut_moderation',
    type: 'enum',
    enum: StatutModeration,
    default: StatutModeration.EN_ATTENTE,
  })
  statutModeration!: StatutModeration;

  @Column({ name: 'motif_moderation', type: 'varchar', length: 500, nullable: true })
  motifModeration?: string | null;

  @Column({ name: 'modere_par_user_id', type: 'uuid', nullable: true })
  modereParUserId?: string | null;

  @Column({ name: 'modere_le', type: 'timestamptz', nullable: true })
  modereLe?: Date | null;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe!: Date;
}
