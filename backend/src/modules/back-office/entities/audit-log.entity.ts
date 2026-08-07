import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../../../common/enums/role.enum';

/**
 * Journal d'audit transverse (CDC §3.0/§3.10) — une entrée par requête mutative
 * (POST/PATCH/DELETE) effectuée par un utilisateur authentifié. Alimenté par
 * `AuditInterceptor`, appliqué globalement : couvre automatiquement tous les
 * modules, y compris ceux à venir (Débats, Fiche-pays côté Dev B).
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: Role })
  role!: Role;

  @Column({ length: 10 })
  methode!: string;

  @Column({ length: 500 })
  route!: string;

  @Column({ name: 'statut_http', type: 'smallint' })
  statutHttp!: number;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe!: Date;
}
