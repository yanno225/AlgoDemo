import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Debat } from './debat.entity';

/** Cycle de vie d'une demande de parole pendant un direct. */
export enum StatutDemandeParole {
  /** Main levée — visible dans la file du modérateur. */
  EN_ATTENTE = 'EN_ATTENTE',
  /** Invité à la tribune — le citoyen s'exprime. */
  ACCORDEE = 'ACCORDEE',
  /** Refusée par le modérateur. */
  REFUSEE = 'REFUSEE',
  /** Annulée par le citoyen lui-même avant décision. */
  ANNULEE = 'ANNULEE',
  /** Passée à la tribune puis redescendue (par lui-même ou par le staff). */
  TERMINEE = 'TERMINEE',
}

/**
 * Demande de prise de parole d'un citoyen pendant un live (« main levée »,
 * comme sur TikTok Live). Le modérateur accorde depuis la console web ; le
 * citoyen monte alors « à la tribune » — la rangée des invités qui parlent.
 *
 * Chaque étape est HORODATÉE et conservée (jamais de suppression) : c'est le
 * journal d'audit des prises de parole d'un événement public. Le nom du
 * demandeur n'est jamais stocké — résolu à la lecture depuis `users`
 * (RG-USR-07 rétroactif, comme pour les messages).
 */
@Entity('demandes_parole')
export class DemandeParole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Debat, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'debatId' })
  debat!: Debat;

  /** Référence au compte (module Auth — pas de relation TypeORM, découplage). */
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ length: 20, default: StatutDemandeParole.EN_ATTENTE })
  statut!: StatutDemandeParole;

  /** Qui a tranché (accordé/refusé/retiré) — traçabilité de la modération. */
  @Column({ type: 'uuid', nullable: true })
  decidePar!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  creeLe!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  majLe!: Date;
}
