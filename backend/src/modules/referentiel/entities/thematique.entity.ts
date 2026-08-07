import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Critere } from './critere.entity';

/**
 * Thématique d'évaluation démocratique (CDC §5) — sommet de la hiérarchie
 * Thématique › Critère › Indicateur. Les 5 thématiques officielles sont
 * insérées par le seed ; l'admin peut en gérer le cycle de vie.
 */
@Entity('thematiques')
export class Thematique {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255, unique: true })
  libelle!: string;

  /** Une thématique "se décline en" critères */
  @OneToMany(() => Critere, (critere) => critere.thematique)
  criteres!: Critere[];
}
