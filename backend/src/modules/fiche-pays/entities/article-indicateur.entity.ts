import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

/**
 * Article rédigé (IA) décrivant un indicateur pour un pays, à partir de toutes
 * les données collectées et de leurs sources. Lu par le citoyen quand il ouvre
 * un indicateur de la fiche-pays. Stocké (cache) pour éviter de le régénérer à
 * chaque consultation.
 */
@Entity('articles_indicateur')
@Unique(['indicateurId', 'paysOuZone'])
export class ArticleIndicateur {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  indicateurId!: string;

  @Column({ length: 100 })
  paysOuZone!: string;

  @Column({ type: 'text' })
  texte!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  genereLe!: Date;
}
