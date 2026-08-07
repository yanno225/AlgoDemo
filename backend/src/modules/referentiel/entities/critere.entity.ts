import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Indicateur } from './indicateur.entity';
import { Thematique } from './thematique.entity';

/**
 * Critère synthétique rattaché à une thématique (CDC §5).
 * Un même libellé peut exister dans deux thématiques différentes,
 * mais pas deux fois dans la même (contrainte d'unicité composite).
 */
@Entity('criteres')
@Unique(['libelle', 'thematique'])
export class Critere {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  libelle!: string;

  /** Supprimer une thématique supprime ses critères (cascade en base) */
  @ManyToOne(() => Thematique, (thematique) => thematique.criteres, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'thematiqueId' })
  thematique!: Thematique;

  /** Un critère "se mesure par" des indicateurs */
  @OneToMany(() => Indicateur, (indicateur) => indicateur.critere)
  indicateurs!: Indicateur[];
}
