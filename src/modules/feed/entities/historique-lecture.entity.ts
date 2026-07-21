import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Contenu } from './contenu.entity';

/** Historique de lecture par utilisateur — "marquer lu" (CDC §6.1) */
@Entity('historique_lecture')
@Unique(['userId', 'contenu'])
export class HistoriqueLecture {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => Contenu, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contenuId' })
  contenu!: Contenu;

  @CreateDateColumn({ name: 'lu_le' })
  luLe!: Date;
}
