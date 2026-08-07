import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Consultation } from './consultation.entity';

/** Option de vote d'une consultation (ex. Pour / Contre / Abstention) */
@Entity('consultation_options')
export class ConsultationOption {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  libelle!: string;

  @ManyToOne(() => Consultation, (consultation) => consultation.options, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'consultationId' })
  consultation!: Consultation;
}
