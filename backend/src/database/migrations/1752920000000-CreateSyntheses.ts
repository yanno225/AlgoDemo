import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Table des synthèses IA de la fiche-pays, avec cycle de validation humaine :
 * EN_ATTENTE_VALIDATION → PUBLIEE ou REJETEE. L'historique est conservé
 * (une ligne par génération).
 */
export class CreateSyntheses1752920000000 implements MigrationInterface {
  name = 'CreateSyntheses1752920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "syntheses_statut_enum" AS ENUM (
        'EN_ATTENTE_VALIDATION', 'PUBLIEE', 'REJETEE'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "syntheses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "paysOuZone" character varying(100) NOT NULL,
        "texteGenereIA" text NOT NULL,
        "texteFinal" text,
        "statut" "syntheses_statut_enum" NOT NULL DEFAULT 'EN_ATTENTE_VALIDATION',
        "dateGeneration" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "dateValidation" TIMESTAMP WITH TIME ZONE,
        "thematiqueId" uuid NOT NULL,
        CONSTRAINT "PK_syntheses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_syntheses_thematique" FOREIGN KEY ("thematiqueId")
          REFERENCES "thematiques"("id") ON DELETE CASCADE
      )
    `);
    // La fiche-pays cherche les synthèses publiées d'un pays
    await queryRunner.query(
      `CREATE INDEX "IDX_syntheses_pays_statut" ON "syntheses" ("paysOuZone", "statut")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "syntheses"`);
    await queryRunner.query(`DROP TYPE "syntheses_statut_enum"`);
  }
}
