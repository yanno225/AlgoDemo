import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration : table `users` (module Auth & Identité, CDC §9.3).
 * Un seul type d'entité pour les trois rôles (UTILISATEUR / POINT_FOCAL / ADMIN).
 */
export class CreateUsers1753100000000 implements MigrationInterface {
  name = 'CreateUsers1753100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('UTILISATEUR', 'POINT_FOCAL', 'ADMIN')`,
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "mot_de_passe_hash" character varying(255) NOT NULL,
        "nom" character varying(100) NOT NULL,
        "prenom" character varying(100) NOT NULL,
        "telephone" character varying(30),
        "role" "users_role_enum" NOT NULL DEFAULT 'UTILISATEUR',
        "email_verifie" boolean NOT NULL DEFAULT false,
        "compte_valide" boolean NOT NULL DEFAULT true,
        "est_bloque" boolean NOT NULL DEFAULT false,
        "otp_code_hash" character varying(255),
        "otp_expire_le" TIMESTAMP WITH TIME ZONE,
        "deux_fa_secret" character varying(255),
        "deux_fa_actif" boolean NOT NULL DEFAULT false,
        "refresh_token_hash" character varying(255),
        "consentement_notifications" boolean NOT NULL DEFAULT false,
        "politique_confidentialite_acceptee_le" TIMESTAMP WITH TIME ZONE,
        "anonymise" boolean NOT NULL DEFAULT false,
        "cree_le" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_telephone" UNIQUE ("telephone")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
