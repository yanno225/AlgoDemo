import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Un débat planifié peut être ANNULÉ par le staff : il sort des écrans
 * publics mais reste en base (traçabilité d'un événement public), et
 * devient supprimable définitivement.
 */
export class AjouterStatutAnnule1755200000000 implements MigrationInterface {
  name = 'AjouterStatutAnnule1755200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ALTER TYPE … ADD VALUE ne peut pas s'exécuter dans une transaction :
    // on clôt celle que TypeORM ouvre, puis on en rouvre une pour la suite.
    await queryRunner.query(`COMMIT`);
    await queryRunner.query(
      `ALTER TYPE "debats_statut_enum" ADD VALUE IF NOT EXISTS 'ANNULE'`,
    );
    await queryRunner.query(`BEGIN`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL ne sait pas retirer une valeur d'un type enum — la valeur
    // reste, inoffensive tant que plus aucun débat ne la porte.
    await queryRunner.query(
      `UPDATE "debats" SET "statut" = 'PLANIFIE' WHERE "statut" = 'ANNULE'`,
    );
  }
}
