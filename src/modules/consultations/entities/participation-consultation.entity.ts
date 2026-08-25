import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Consultation } from './consultation.entity';

/**
 * Émargement : atteste QU'UN citoyen a voté, jamais POUR QUOI (CDC §6.3).
 *
 * C'est la moitié « registre » du vote secret. Elle porte l'identité et
 * garantit l'unicité (1 vote par personne et par consultation) ; le choix
 * exprimé vit dans `bulletins`, sans aucun lien avec cette table.
 *
 * Ne jamais ajouter ici de colonne désignant l'option choisie : ce serait
 * rétablir le lien que cette séparation existe pour rompre.
 */
@Entity('participations_consultation')
@Unique(['userId', 'consultation'])
export class ParticipationConsultation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => Consultation, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultationId' })
  consultation!: Consultation;

  @CreateDateColumn({ name: 'participe_le', type: 'timestamptz' })
  participeLe!: Date;
}
