import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Thematique } from '../../referentiel/entities/thematique.entity';
import { StatutSynthese } from '../enums/statut-synthese.enum';

/**
 * Synthèse rédigée par l'IA pour une thématique et un pays, soumise à
 * validation humaine avant publication (CDC : texteGenereIA / valideHumainement).
 *
 * Chaque génération crée une nouvelle ligne : l'historique est conservé.
 * La fiche-pays publique n'affiche que la synthèse PUBLIEE la plus récente
 * de chaque thématique.
 */
@Entity('syntheses')
export class Synthese {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  paysOuZone!: string;

  /** Brouillon produit par l'IA — jamais montré au public tel quel */
  @Column({ type: 'text' })
  texteGenereIA!: string;

  /** Version validée (éventuellement corrigée) par l'admin — c'est ELLE qui est publiée */
  @Column({ type: 'text', nullable: true })
  texteFinal!: string | null;

  @Column({
    type: 'enum',
    enum: StatutSynthese,
    default: StatutSynthese.EN_ATTENTE_VALIDATION,
  })
  statut!: StatutSynthese;

  @CreateDateColumn({ type: 'timestamptz' })
  dateGeneration!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  dateValidation!: Date | null;

  @ManyToOne(() => Thematique, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'thematiqueId' })
  thematique!: Thematique;
}
