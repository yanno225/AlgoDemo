import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fil de discussion des lives (CDC §6.4). Messages publiés immédiatement,
 * modérés a posteriori : la suppression par le staff MASQUE
 * (supprimeLe/supprimePar) au lieu d'effacer, pour garder la traçabilité.
 */
export class CreerMessagesDebat1754700000000 implements MigrationInterface {
  name = 'CreerMessagesDebat1754700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "messages_debat" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "debatId" uuid NOT NULL,
        "auteurId" uuid NOT NULL,
        "texte" character varying(500) NOT NULL,
        "supprimeLe" TIMESTAMP WITH TIME ZONE,
        "supprimePar" uuid,
        "creeLe" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages_debat" PRIMARY KEY ("id"),
        CONSTRAINT "FK_message_debat" FOREIGN KEY ("debatId")
          REFERENCES "debats"("id") ON DELETE CASCADE
      )
    `);
    // La lecture nominale : les derniers messages visibles d'UN débat.
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_debat_debat_date" ON "messages_debat" ("debatId", "creeLe")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_debat_auteur" ON "messages_debat" ("auteurId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "messages_debat"`);
  }
}
