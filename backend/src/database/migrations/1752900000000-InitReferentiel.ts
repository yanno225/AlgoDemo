import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration initiale : tables du Référentiel d'évaluation démocratique.
 * Hiérarchie : thematiques ← criteres ← indicateurs (FK ON DELETE CASCADE).
 */
export class InitReferentiel1752900000000 implements MigrationInterface {
  name = 'InitReferentiel1752900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extension nécessaire à la génération des UUID (défaut TypeORM sur PostgreSQL)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "thematiques" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "libelle" character varying(255) NOT NULL,
        CONSTRAINT "PK_thematiques" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_thematiques_libelle" UNIQUE ("libelle")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "criteres" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "libelle" character varying(255) NOT NULL,
        "thematiqueId" uuid NOT NULL,
        CONSTRAINT "PK_criteres" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_criteres_libelle_thematique" UNIQUE ("libelle", "thematiqueId"),
        CONSTRAINT "FK_criteres_thematique" FOREIGN KEY ("thematiqueId")
          REFERENCES "thematiques"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_criteres_thematiqueId" ON "criteres" ("thematiqueId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "indicateurs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "libelle" character varying(500) NOT NULL,
        "critereId" uuid NOT NULL,
        CONSTRAINT "PK_indicateurs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_indicateurs_libelle_critere" UNIQUE ("libelle", "critereId"),
        CONSTRAINT "FK_indicateurs_critere" FOREIGN KEY ("critereId")
          REFERENCES "criteres"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_indicateurs_critereId" ON "indicateurs" ("critereId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "indicateurs"`);
    await queryRunner.query(`DROP TABLE "criteres"`);
    await queryRunner.query(`DROP TABLE "thematiques"`);
  }
}
