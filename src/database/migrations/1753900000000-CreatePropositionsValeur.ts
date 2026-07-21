import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Table des propositions de valeurs issues de la collecte automatique
 * (Banque Mondiale, extraction IA), en attente de validation admin.
 */
export class CreatePropositionsValeur1753900000000
  implements MigrationInterface
{
  name = 'CreatePropositionsValeur1753900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "propositions_valeur_statut_enum" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REJETEE')`,
    );
    await queryRunner.query(`
      CREATE TABLE "propositions_valeur" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "indicateurId" uuid NOT NULL,
        "valeur" double precision NOT NULL,
        "dateMesure" date NOT NULL,
        "paysOuZone" character varying(100) NOT NULL,
        "source" character varying(500) NOT NULL,
        "statut" "propositions_valeur_statut_enum" NOT NULL DEFAULT 'EN_ATTENTE',
        "collecteLe" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_propositions_valeur" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_proposition_indic_pays_date_source" UNIQUE ("indicateurId", "paysOuZone", "dateMesure", "source"),
        CONSTRAINT "FK_propositions_indicateur" FOREIGN KEY ("indicateurId")
          REFERENCES "indicateurs"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_propositions_statut" ON "propositions_valeur" ("statut")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "propositions_valeur"`);
    await queryRunner.query(`DROP TYPE "propositions_valeur_statut_enum"`);
  }
}
