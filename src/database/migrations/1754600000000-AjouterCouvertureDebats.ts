import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Image de couverture des débats (MinIO). Plusieurs lives peuvent être
 * simultanés : la couverture est ce qui les distingue visuellement côté
 * mobile, le style restant commun (exigence produit).
 */
export class AjouterCouvertureDebats1754600000000 implements MigrationInterface {
  name = 'AjouterCouvertureDebats1754600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "debats" ADD "urlCouverture" character varying(1000)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "debats" DROP COLUMN "urlCouverture"`,
    );
  }
}
