import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration : module Consultations & Participation (CDC §6.2-§6.3).
 * `consultations` + `consultation_options` (vote), `votes` (1 vote/consultation),
 * `avis` (rattachés au Référentiel, modérés avant publication).
 */
export class CreateConsultations1753300000000 implements MigrationInterface {
  name = 'CreateConsultations1753300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "avis_statut_moderation_enum" AS ENUM ('EN_ATTENTE', 'APPROUVE', 'REJETE')`,
    );

    await queryRunner.query(`
      CREATE TABLE "consultations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "titre" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "resume_vulgarise" text NOT NULL,
        "date_ouverture" TIMESTAMP WITH TIME ZONE NOT NULL,
        "date_cloture" TIMESTAMP WITH TIME ZONE NOT NULL,
        "resultats_publies" boolean NOT NULL DEFAULT false,
        "cree_le" TIMESTAMP NOT NULL DEFAULT now(),
        "maj_le" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_consultations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "consultation_options" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "libelle" character varying(255) NOT NULL,
        "consultationId" uuid NOT NULL,
        CONSTRAINT "PK_consultation_options" PRIMARY KEY ("id"),
        CONSTRAINT "FK_consultation_options_consultation" FOREIGN KEY ("consultationId")
          REFERENCES "consultations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_consultation_options_consultationId" ON "consultation_options" ("consultationId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "votes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "consultationId" uuid NOT NULL,
        "optionId" uuid NOT NULL,
        "vote_le" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_votes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_votes_user_consultation" UNIQUE ("user_id", "consultationId"),
        CONSTRAINT "FK_votes_consultation" FOREIGN KEY ("consultationId")
          REFERENCES "consultations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_votes_option" FOREIGN KEY ("optionId")
          REFERENCES "consultation_options"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "avis" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "texte" text NOT NULL,
        "thematiqueId" uuid NOT NULL,
        "auteur_id" uuid NOT NULL,
        "statut_moderation" "avis_statut_moderation_enum" NOT NULL DEFAULT 'EN_ATTENTE',
        "motif_moderation" character varying(500),
        "modere_par_user_id" uuid,
        "modere_le" TIMESTAMP WITH TIME ZONE,
        "cree_le" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_avis" PRIMARY KEY ("id"),
        CONSTRAINT "FK_avis_thematique" FOREIGN KEY ("thematiqueId")
          REFERENCES "thematiques"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_avis_thematiqueId" ON "avis" ("thematiqueId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_avis_statut_moderation" ON "avis" ("statut_moderation")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "avis"`);
    await queryRunner.query(`DROP TABLE "votes"`);
    await queryRunner.query(`DROP TABLE "consultation_options"`);
    await queryRunner.query(`DROP TABLE "consultations"`);
    await queryRunner.query(`DROP TYPE "avis_statut_moderation_enum"`);
  }
}
