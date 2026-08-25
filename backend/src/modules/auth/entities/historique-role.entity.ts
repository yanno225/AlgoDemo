import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum';

/** Nature de la décision administrative portée sur un compte (§9.3). */
export enum TypeDecision {
  ROLE = 'ROLE',
  VALIDATION = 'VALIDATION',
  BLOCAGE = 'BLOCAGE',
}

/**
 * Journal des décisions administratives prises SUR un compte.
 *
 * Le journal d'audit HTTP (`audit_logs`) ne suffit pas : il enregistre l'auteur
 * de la requête et la route, mais jamais le corps — on y voit qu'un rôle a
 * changé, sans savoir vers lequel. Or certifier un point focal engage le
 * Laboratoire : la décision doit être reconstituable (qui, quand, de quoi vers
 * quoi), y compris des années plus tard.
 *
 * Table en ajout seul : une ligne n'est jamais modifiée ni supprimée. Pas de
 * clé étrangère vers `users` — un compte supprimé ne doit pas emporter la
 * trace des décisions prises à son sujet.
 */
@Entity('historique_roles')
@Index(['userCibleId'])
export class HistoriqueRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Compte qui subit la décision. */
  @Column({ name: 'user_cible_id', type: 'uuid' })
  userCibleId!: string;

  /** Administrateur qui l'a prise. */
  @Column({ name: 'decide_par_user_id', type: 'uuid' })
  decideParUserId!: string;

  @Column({ type: 'enum', enum: TypeDecision })
  type!: TypeDecision;

  /** Rôle avant / après — renseignés uniquement pour `type = ROLE`. */
  @Column({ name: 'ancien_role', type: 'enum', enum: Role, nullable: true })
  ancienRole!: Role | null;

  @Column({ name: 'nouveau_role', type: 'enum', enum: Role, nullable: true })
  nouveauRole!: Role | null;

  /**
   * Sens de la décision pour les types VALIDATION et BLOCAGE :
   * `true` = compte validé / bloqué, `false` = validation retirée / débloqué.
   */
  @Column({ type: 'boolean', nullable: true })
  actif!: boolean | null;

  @CreateDateColumn({ name: 'decide_le', type: 'timestamptz' })
  decideLe!: Date;
}
