import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Citations sur les propositions de collecte (exigence du jury : chaque
 * chiffre doit être vérifiable) :
 *  - extrait   : passage verbatim du document d'où la valeur est tirée
 *  - urlSource : URL exacte du document analysé (lien cliquable)
 * Nullables : les connecteurs HTTP (Banque Mondiale, OMS) n'en produisent pas.
 */
export class AjouterCitationsPropositions1754100000000
  implements MigrationInterface
{
  name = 'AjouterCitationsPropositions1754100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "propositions_valeur" ADD "extrait" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "propositions_valeur" ADD "urlSource" character varying(1000)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "propositions_valeur" DROP COLUMN "urlSource"`,
    );
    await queryRunner.query(
      `ALTER TABLE "propositions_valeur" DROP COLUMN "extrait"`,
    );
  }
}
