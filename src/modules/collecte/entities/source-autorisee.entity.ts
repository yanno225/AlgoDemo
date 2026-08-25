import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * LISTE BLANCHE des sources de collecte (CDC §7 — fiabilité des données).
 * Aucun texte ne peut être ingéré par l'IA si sa source déclarée ne
 * correspond pas à une entrée ACTIVE de cette table : c'est le premier
 * garde-fou du pipeline (liste blanche → extraction avec citations →
 * triangulation → validation humaine).
 *
 * Gérée par les admins depuis le back-office (CRUD /collecte/sources).
 */
@Entity('sources_autorisees')
export class SourceAutorisee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Nom officiel de la source (ex. « Banque Mondiale », « CEI ») */
  @Column({ length: 255, unique: true })
  libelle!: string;

  /**
   * Domaine web de la source (ex. « worldbank.org ») — permet de valider
   * l'URL d'un document ingéré. Nullable : certaines sources n'ont pas de
   * domaine unique (rapports papier, publications officielles).
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  domaine!: string | null;

  /** Description libre (qui publie quoi, périmètre, fiabilité) */
  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** Une source désactivée reste en base (traçabilité) mais bloque l'ingestion */
  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  creeLe!: Date;
}
