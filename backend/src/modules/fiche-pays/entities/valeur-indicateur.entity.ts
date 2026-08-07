import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Indicateur } from '../../referentiel/entities/indicateur.entity';

/**
 * Valeur mesurée d'un indicateur pour un pays/zone à une date donnée.
 * C'est le "réservoir" de la Fiche-pays : rempli aujourd'hui à la main ou
 * par import CSV (admin), demain par le pipeline scraping → IA → validation.
 *
 * Une seule valeur par (indicateur, pays, date) : l'historique des dates
 * permet d'afficher l'évolution dans le temps (séries temporelles).
 */
@Entity('valeurs_indicateurs')
@Unique(['indicateur', 'paysOuZone', 'dateMesure'])
export class ValeurIndicateur {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Valeur numérique (taux, nombre de cas, coût...) */
  @Column({ type: 'double precision' })
  valeur!: number;

  /** Date de la mesure (souvent une année : 2024-01-01) */
  @Column({ type: 'date' })
  dateMesure!: string;

  /** Pays ou zone concernée — ex. "Côte d'Ivoire" (pilote), plus tard les 19 pays */
  @Column({ length: 100 })
  paysOuZone!: string;

  /** Provenance de la donnée (exigence de traçabilité / triangulation) */
  @Column({ length: 500 })
  source!: string;

  /** Supprimer un indicateur supprime ses valeurs (cascade en base) */
  @ManyToOne(() => Indicateur, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'indicateurId' })
  indicateur!: Indicateur;
}
