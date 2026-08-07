import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration : tables du module Feed (CDC §6.1) — `contenus` (rattachés au
 * Référentiel via thematiqueId) et `historique_lecture` ("marquer lu").
 */
export class CreateFeed1753200000000 implements MigrationInterface {
  name = 'CreateFeed1753200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "contenus_type_enum" AS ENUM ('VIDEO', 'FICHE', 'ARTICLE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "contenus_statut_verification_enum" AS ENUM ('NON_VERIFIE', 'PARTIELLEMENT_VERIFIE', 'VERIFIE')`,
    );

    await queryRunner.query(`
      CREATE TABLE "contenus" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "titre" character varying(255) NOT NULL,
        "corps" text NOT NULL,
        "type" "contenus_type_enum" NOT NULL,
        "statut_verification" "contenus_statut_verification_enum" NOT NULL DEFAULT 'NON_VERIFIE',
        "est_officiel" boolean NOT NULL DEFAULT false,
        "source" character varying(500),
        "url_media" character varying(1000),
        "url_audio" character varying(1000),
        "telechargeable" boolean NOT NULL DEFAULT false,
        "est_publie" boolean NOT NULL DEFAULT false,
        "publie_le" TIMESTAMP WITH TIME ZONE,
        "thematiqueId" uuid NOT NULL,
        "auteur_id" uuid NOT NULL,
        "cree_le" TIMESTAMP NOT NULL DEFAULT now(),
        "maj_le" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contenus" PRIMARY KEY ("id"),
        CONSTRAINT "FK_contenus_thematique" FOREIGN KEY ("thematiqueId")
          REFERENCES "thematiques"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_contenus_thematiqueId" ON "contenus" ("thematiqueId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contenus_est_publie" ON "contenus" ("est_publie")`,
    );

    await queryRunner.query(`
      CREATE TABLE "historique_lecture" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "contenuId" uuid NOT NULL,
        "lu_le" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_historique_lecture" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_historique_lecture_user_contenu" UNIQUE ("user_id", "contenuId"),
        CONSTRAINT "FK_historique_lecture_contenu" FOREIGN KEY ("contenuId")
          REFERENCES "contenus"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_historique_lecture_user_id" ON "historique_lecture" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "historique_lecture"`);
    await queryRunner.query(`DROP TABLE "contenus"`);
    await queryRunner.query(`DROP TYPE "contenus_statut_verification_enum"`);
    await queryRunner.query(`DROP TYPE "contenus_type_enum"`);
  }
}
