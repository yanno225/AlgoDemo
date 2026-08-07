import { MigrationInterface, QueryRunner } from 'typeorm';

/** Migration : module Notifications (CDC §3.0/§3.9) — device_tokens (push) + notifications (in-app) */
export class CreateNotifications1753400000000 implements MigrationInterface {
  name = 'CreateNotifications1753400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "device_tokens_plateforme_enum" AS ENUM ('IOS', 'ANDROID', 'WEB')`,
    );
    await queryRunner.query(
      `CREATE TYPE "notifications_type_enum" AS ENUM ('DEBAT_DEMARRE', 'RESULTATS_PUBLIES', 'NOUVEAU_CONTENU', 'MODERATION')`,
    );

    await queryRunner.query(`
      CREATE TABLE "device_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token" character varying(500) NOT NULL,
        "plateforme" "device_tokens_plateforme_enum" NOT NULL,
        "cree_le" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_device_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_device_tokens_token" UNIQUE ("token")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_device_tokens_user_id" ON "device_tokens" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "type" "notifications_type_enum" NOT NULL,
        "titre" character varying(255) NOT NULL,
        "corps" text NOT NULL,
        "donnees" jsonb,
        "lue" boolean NOT NULL DEFAULT false,
        "cree_le" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "device_tokens"`);
    await queryRunner.query(`DROP TYPE "notifications_type_enum"`);
    await queryRunner.query(`DROP TYPE "device_tokens_plateforme_enum"`);
  }
}
