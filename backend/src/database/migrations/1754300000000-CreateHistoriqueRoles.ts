import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Journal des décisions administratives portées sur un compte (§9.3).
 *
 * `audit_logs` ne journalise pas le corps des requêtes : on y voit qu'un rôle
 * a changé, jamais vers lequel. Cette table rend la certification d'un point
 * focal réellement reconstituable — c'est ce que l'interface promet.
 *
 * Pas de clé étrangère vers `users` : la trace d'une décision doit survivre à
 * la suppression du compte concerné.
 */
export class CreateHistoriqueRoles1754300000000 implements MigrationInterface {
  name = 'CreateHistoriqueRoles1754300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "historique_roles_type_enum" AS ENUM ('ROLE', 'VALIDATION', 'BLOCAGE')`,
    );
    await queryRunner.query(`
      CREATE TABLE "historique_roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_cible_id" uuid NOT NULL,
        "decide_par_user_id" uuid NOT NULL,
        "type" "historique_roles_type_enum" NOT NULL,
        "ancien_role" "users_role_enum",
        "nouveau_role" "users_role_enum",
        "actif" boolean,
        "decide_le" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_historique_roles" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_historique_roles_cible" ON "historique_roles" ("user_cible_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "historique_roles"`);
    await queryRunner.query(`DROP TYPE "historique_roles_type_enum"`);
  }
}
