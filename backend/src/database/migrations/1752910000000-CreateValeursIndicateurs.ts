import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Table des valeurs mesurées d'indicateurs (module Fiche-pays).
 * Unicité (indicateur, pays, date) : une seule mesure par indicateur,
 * par pays et par date — l'historique des dates fait les séries temporelles.
 */
export class CreateValeursIndicateurs1752910000000
  implements MigrationInterface
{
  name = 'CreateValeursIndicateurs1752910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "valeurs_indicateurs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "valeur" double precision NOT NULL,
        "dateMesure" date NOT NULL,
        "paysOuZone" character varying(100) NOT NULL,
        "source" character varying(500) NOT NULL,
        "indicateurId" uuid NOT NULL,
        CONSTRAINT "PK_valeurs_indicateurs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_valeurs_indicateur_pays_date" UNIQUE ("indicateurId", "paysOuZone", "dateMesure"),
        CONSTRAINT "FK_valeurs_indicateur" FOREIGN KEY ("indicateurId")
          REFERENCES "indicateurs"("id") ON DELETE CASCADE
      )
    `);
    // La fiche-pays interroge toujours par pays
    await queryRunner.query(
      `CREATE INDEX "IDX_valeurs_paysOuZone" ON "valeurs_indicateurs" ("paysOuZone")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "valeurs_indicateurs"`);
  }
}
