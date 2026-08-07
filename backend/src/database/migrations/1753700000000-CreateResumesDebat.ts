import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Table des résumés de débat (IA + validation humaine → publication au Feed).
 * Même cycle que les synthèses fiche-pays.
 */
export class CreateResumesDebat1753700000000 implements MigrationInterface {
  name = 'CreateResumesDebat1753700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "resumes_debat_statut_enum" AS ENUM ('EN_ATTENTE_VALIDATION', 'PUBLIE', 'REJETE')`,
    );
    await queryRunner.query(`
      CREATE TABLE "resumes_debat" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "debatId" uuid NOT NULL,
        "texteGenereIA" text NOT NULL,
        "texteFinal" text,
        "statut" "resumes_debat_statut_enum" NOT NULL DEFAULT 'EN_ATTENTE_VALIDATION',
        "valideParUserId" uuid,
        "dateGeneration" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "dateValidation" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_resumes_debat" PRIMARY KEY ("id"),
        CONSTRAINT "FK_resumes_debat" FOREIGN KEY ("debatId")
          REFERENCES "debats"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_resumes_debat_statut" ON "resumes_debat" ("debatId", "statut")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "resumes_debat"`);
    await queryRunner.query(`DROP TYPE "resumes_debat_statut_enum"`);
  }
}
