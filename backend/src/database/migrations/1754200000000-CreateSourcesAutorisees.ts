import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Liste blanche des sources de collecte (CDC §7). L'ingestion de texte par
 * l'IA est refusée si la source déclarée n'est pas dans cette table (active).
 */
export class CreateSourcesAutorisees1754200000000 implements MigrationInterface {
  name = 'CreateSourcesAutorisees1754200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sources_autorisees" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "libelle" character varying(255) NOT NULL,
        "domaine" character varying(255),
        "description" text,
        "active" boolean NOT NULL DEFAULT true,
        "creeLe" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sources_autorisees" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sources_autorisees_libelle" UNIQUE ("libelle")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sources_autorisees"`);
  }
}
