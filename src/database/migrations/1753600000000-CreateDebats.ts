import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tables du module Débats & Lives (CDC §6.4) :
 * debats, participations_debat, affirmations_debat (votes en direct),
 * votes_affirmation, signalements_debat.
 */
export class CreateDebats1753600000000 implements MigrationInterface {
  name = 'CreateDebats1753600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "debats_statut_enum" AS ENUM ('PLANIFIE', 'EN_COURS', 'TERMINE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "participations_debat_role_enum" AS ENUM ('SPECTATEUR', 'INTERVENANT', 'MODERATEUR')`,
    );
    await queryRunner.query(
      `CREATE TYPE "affirmations_debat_statut_enum" AS ENUM ('OUVERTE', 'FERMEE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "signalements_debat_statut_enum" AS ENUM ('EN_ATTENTE', 'TRAITE')`,
    );

    await queryRunner.query(`
      CREATE TABLE "debats" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "titre" character varying(255) NOT NULL,
        "description" text,
        "statut" "debats_statut_enum" NOT NULL DEFAULT 'PLANIFIE',
        "dateDebut" TIMESTAMP WITH TIME ZONE NOT NULL,
        "urlReplay" character varying(500),
        "moderateurId" uuid,
        "thematiqueId" uuid NOT NULL,
        "creeLe" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_debats" PRIMARY KEY ("id"),
        CONSTRAINT "FK_debats_thematique" FOREIGN KEY ("thematiqueId")
          REFERENCES "thematiques"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_debats_moderateur" FOREIGN KEY ("moderateurId")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_debats_statut" ON "debats" ("statut")`,
    );

    await queryRunner.query(`
      CREATE TABLE "participations_debat" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "debatId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "role" "participations_debat_role_enum" NOT NULL DEFAULT 'SPECTATEUR',
        "rejointLe" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_participations_debat" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_participation_debat_user" UNIQUE ("debatId", "userId"),
        CONSTRAINT "FK_participations_debat" FOREIGN KEY ("debatId")
          REFERENCES "debats"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_participations_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "affirmations_debat" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "debatId" uuid NOT NULL,
        "texte" character varying(500) NOT NULL,
        "statut" "affirmations_debat_statut_enum" NOT NULL DEFAULT 'OUVERTE',
        "creeLe" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_affirmations_debat" PRIMARY KEY ("id"),
        CONSTRAINT "FK_affirmations_debat" FOREIGN KEY ("debatId")
          REFERENCES "debats"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "votes_affirmation" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "affirmationId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "valide" boolean NOT NULL,
        "voteLe" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_votes_affirmation" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vote_affirmation_user" UNIQUE ("affirmationId", "userId"),
        CONSTRAINT "FK_votes_affirmation" FOREIGN KEY ("affirmationId")
          REFERENCES "affirmations_debat"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_votes_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "signalements_debat" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "debatId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "message" character varying(500) NOT NULL,
        "statut" "signalements_debat_statut_enum" NOT NULL DEFAULT 'EN_ATTENTE',
        "creeLe" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_signalements_debat" PRIMARY KEY ("id"),
        CONSTRAINT "FK_signalements_debat" FOREIGN KEY ("debatId")
          REFERENCES "debats"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_signalements_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "signalements_debat"`);
    await queryRunner.query(`DROP TABLE "votes_affirmation"`);
    await queryRunner.query(`DROP TABLE "affirmations_debat"`);
    await queryRunner.query(`DROP TABLE "participations_debat"`);
    await queryRunner.query(`DROP TABLE "debats"`);
    await queryRunner.query(`DROP TYPE "signalements_debat_statut_enum"`);
    await queryRunner.query(`DROP TYPE "affirmations_debat_statut_enum"`);
    await queryRunner.query(`DROP TYPE "participations_debat_role_enum"`);
    await queryRunner.query(`DROP TYPE "debats_statut_enum"`);
  }
}
