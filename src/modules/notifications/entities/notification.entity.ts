import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TypeNotification } from '../enums/type-notification.enum';

/** Notification in-app (+ déclenchement push) — CDC §3.9 */
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: TypeNotification })
  type!: TypeNotification;

  @Column({ length: 255 })
  titre!: string;

  @Column({ type: 'text' })
  corps!: string;

  /** Métadonnées libres (ex. { contenuId }, { consultationId }, { avisId }) pour le deep-link mobile */
  @Column({ type: 'jsonb', nullable: true })
  donnees?: Record<string, unknown> | null;

  @Column({ default: false })
  lue!: boolean;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe!: Date;
}
