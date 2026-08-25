import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConsultationOption } from './consultation-option.entity';
import { Consultation } from './consultation.entity';

/**
 * Bulletin déposé dans l'urne : le choix exprimé, SANS son auteur (CDC §6.3).
 *
 * C'est la moitié « urne » du vote secret. Aucune colonne ne désigne le
 * votant, et aucune requête de l'application ne peut donc répondre à « qui a
 * voté quoi ». L'unicité du vote est assurée ailleurs, par
 * `participations_consultation`.
 *
 * Deux précautions contre la ré-identification par recoupement :
 *  - l'identifiant est un UUID v4 (aléatoire), pas une séquence : l'ordre des
 *    bulletins ne trahit pas l'ordre des votants ;
 *  - la date est stockée au JOUR près, pas à la milliseconde : sans cela, un
 *    horodatage précis suffirait à rapprocher un bulletin d'un émargement.
 *
 * Ne jamais ajouter ici de colonne `user_id`, ni d'horodatage plus fin.
 */
@Entity('bulletins')
export class Bulletin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Consultation, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultationId' })
  consultation!: Consultation;

  @ManyToOne(() => ConsultationOption, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'optionId' })
  option!: ConsultationOption;

  /** Jour du dépôt — volontairement sans heure (voir commentaire de classe). */
  @Column({ name: 'depose_le', type: 'date', default: () => 'CURRENT_DATE' })
  deposeLe!: string;
}
