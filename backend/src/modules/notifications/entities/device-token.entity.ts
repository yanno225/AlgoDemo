import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Plateforme } from '../enums/plateforme.enum';

/** Token d'appareil enregistré pour l'envoi push (FCM/APNs, CDC §3.0/§3.9) */
@Entity('device_tokens')
export class DeviceToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 500, unique: true })
  token!: string;

  @Column({ type: 'enum', enum: Plateforme })
  plateforme!: Plateforme;

  @CreateDateColumn({ name: 'cree_le' })
  creeLe!: Date;
}
