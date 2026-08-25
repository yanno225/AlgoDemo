import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Les sondages rapides réutilisent le moteur des consultations (émargement +
 * urne, vote secret) : un simple champ `type` les distingue, au lieu de
 * dupliquer toute la machinerie dans un second module.
 */
export class AjouterTypeConsultation1754900000000 implements MigrationInterface {
  name = 'AjouterTypeConsultation1754900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "type_consultation_enum" AS ENUM ('CONSULTATION','SONDAGE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" ADD "type" "type_consultation_enum" NOT NULL DEFAULT 'CONSULTATION'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "consultations" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "type_consultation_enum"`);
  }
}
