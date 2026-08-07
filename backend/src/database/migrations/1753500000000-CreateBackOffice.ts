import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration : back-office / modération transverse (CDC §3.10).
 * `signalements` (Feed) et `audit_logs` (journal d'audit global).
 */
export class CreateBackOffice1753500000000 implements MigrationInterface {
  name = 'CreateBackOffice1753500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "signalements_statut_enum" AS ENUM ('EN_ATTENTE', 'TRAITE', 'REJETE')`,
    );
    await queryRunner.query(`
      CREATE TABLE "signalements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contenuId" uuid NOT NULL,
        "signale_par" uuid NOT NULL,
        "motif" text NOT NULL,
        "statut" "signalements_statut_enum" NOT NULL DEFAULT 'EN_ATTENTE',
        "traite_par_user_id" uuid,
        "traite_le" TIMESTAMP WITH TIME ZONE,
        "cree_le" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_signalements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_signalements_contenu" FOREIGN KEY ("contenuId")
          REFERENCES "contenus"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_signalements_contenuId" ON "signalements" ("contenuId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_signalements_statut" ON "signalements" ("statut")`,
    );

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "role" "users_role_enum" NOT NULL,
        "methode" character varying(10) NOT NULL,
        "route" character varying(500) NOT NULL,
        "statut_http" smallint NOT NULL,
        "cree_le" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "signalements"`);
    await queryRunner.query(`DROP TYPE "signalements_statut_enum"`);
  }
}
