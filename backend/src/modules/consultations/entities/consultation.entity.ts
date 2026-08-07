import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConsultationOption } from './consultation-option.entity';

/** Consultation citoyenne / projet de loi vulgarisé (CDC §6.2) */
@Entity('consultations')
export class Consultation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  titre!: string;

  @Column({ type: 'text' })
  description!: string;

  /** Vulgarisation du projet de loi/texte soumis à consultation */
  @Column({ name: 'resume_vulgarise', type: 'text' })
  resumeVulgarise!: string;

  @Column({ name: 'date_ouverture', type: 'timestamptz' })
  dateOuverture!: Date;

  @Column({ name: 'date_cloture', type: 'timestamptz' })
  dateCloture!: Date;

  @Column({ name: 'resultats_publies', default: false })
  resultatsPublies!: boolean;

  @OneToMany(() => ConsultationOption, (option) => option.consultation, {
    cascade: ['insert'],
  })
  options!: ConsultationOption[];

  @CreateDateColumn({ name: 'cree_le' })
  creeLe!: Date;

  @UpdateDateColumn({ name: 'maj_le' })
  majLe!: Date;

  /** true si la consultation est actuellement ouverte au vote (CDC : Consultation.estOuverte()) */
  estOuverte(): boolean {
    const maintenant = new Date();
    return maintenant >= this.dateOuverture && maintenant <= this.dateCloture;
  }
}
