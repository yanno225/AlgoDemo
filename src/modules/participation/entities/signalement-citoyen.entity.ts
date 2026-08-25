import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  CategorieSignalement,
  StatutSignalementCitoyen,
} from '../enums/signalement-citoyen.enums';

/**
 * Signalement citoyen de terrain (CDC §6.1 « Participation citoyenne ») :
 * un problème constaté — voirie, éclairage, désinformation… — décrit,
 * localisé et éventuellement photographié depuis l'application.
 *
 * Distinct des signalements de direct (module Débats) et des signalements de
 * contenus (module Feed) : ici on signale le monde réel, pas la plateforme.
 * `auteurId` référence un compte (module Auth) par identifiant seul —
 * découplage habituel. La liste publique « récents » ne l'expose jamais.
 */
@Entity('signalements_citoyens')
export class SignalementCitoyen {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  auteurId!: string;

  @Column({ type: 'enum', enum: CategorieSignalement })
  categorie!: CategorieSignalement;

  @Column({ type: 'text' })
  description!: string;

  /** Adresse lisible, saisie ou issue du géocodage inverse du téléphone. */
  @Column({ length: 300 })
  adresse!: string;

  // Position GPS facultative : la précision du point aide les équipes de
  // terrain, mais un signalement saisi à la main reste recevable.
  @Column({ type: 'double precision', nullable: true })
  latitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude!: number | null;

  /** Photo du constat (MinIO, via POST /media/upload). */
  @Column({ type: 'varchar', length: 1000, nullable: true })
  urlPhoto!: string | null;

  @Column({
    type: 'enum',
    enum: StatutSignalementCitoyen,
    default: StatutSignalementCitoyen.RECU,
  })
  statut!: StatutSignalementCitoyen;

  /** Qui a fait évoluer le statut en dernier (staff) — traçabilité. */
  @Column({ type: 'uuid', nullable: true })
  traiteParUserId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  traiteLe!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  creeLe!: Date;
}
