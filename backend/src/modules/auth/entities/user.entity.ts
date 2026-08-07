import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum';

/**
 * Compte utilisateur — socle du module Auth & Identité (CDC §9.3).
 * Un seul et même type d'entité pour les trois rôles (UTILISATEUR / POINT_FOCAL
 * / ADMIN) : le rôle détermine les permissions via le RolesGuard partagé.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ name: 'mot_de_passe_hash', length: 255 })
  motDePasseHash!: string;

  @Column({ length: 100 })
  nom!: string;

  @Column({ length: 100 })
  prenom!: string;

  @Column({ type: 'varchar', length: 30, nullable: true, unique: true })
  telephone?: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.UTILISATEUR })
  role!: Role;

  /** Confirmée via le code OTP envoyé à l'inscription (`otpCodeHash`) */
  @Column({ name: 'email_verifie', default: false })
  emailVerifie!: boolean;

  /** Bascule administrateur (§9.3) — indépendante de emailVerifie */
  @Column({ name: 'compte_valide', default: true })
  compteValide!: boolean;

  /** Blocage administrateur (§9.3) */
  @Column({ name: 'est_bloque', default: false })
  estBloque!: boolean;

  @Column({ name: 'otp_code_hash', type: 'varchar', length: 255, nullable: true })
  otpCodeHash?: string | null;

  @Column({ name: 'otp_expire_le', type: 'timestamptz', nullable: true })
  otpExpireLe?: Date | null;

  /** Secret TOTP (base32) — non actif tant que deuxFaActif est faux */
  @Column({ name: 'deux_fa_secret', type: 'varchar', length: 255, nullable: true })
  deuxFaSecret?: string | null;

  /** 2FA obligatoire pour les votes (§6.3) */
  @Column({ name: 'deux_fa_actif', default: false })
  deuxFaActif!: boolean;

  /** Hash du refresh token courant — permet la révocation (logout, rotation) */
  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 255, nullable: true })
  refreshTokenHash?: string | null;

  /** RGPD — consentement aux notifications (§9.3) */
  @Column({ name: 'consentement_notifications', default: false })
  consentementNotifications!: boolean;

  /** RGPD — date d'acceptation de la politique de confidentialité */
  @Column({
    name: 'politique_confidentialite_acceptee_le',
    type: 'timestamptz',
    nullable: true,
  })
  politiqueConfidentialiteAccepteeLe?: Date | null;

  /** RGPD — demanderAnonymisation() (§9.3, zones à risque) */
  @Column({ default: false })
  anonymise!: boolean;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe!: Date;
}
