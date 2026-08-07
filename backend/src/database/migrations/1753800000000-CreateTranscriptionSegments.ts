import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Table des segments de transcription en direct des débats (verbatim parlé).
 * Sert de base factuelle au résumé IA.
 */
export class CreateTranscriptionSegments1753800000000
  implements MigrationInterface
{
  name = 'CreateTranscriptionSegments1753800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "transcription_segments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "debatId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "intervenant" character varying(255) NOT NULL,
        "texte" text NOT NULL,
        "creeLe" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transcription_segments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transcription_segments_debat" FOREIGN KEY ("debatId")
          REFERENCES "debats"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_transcription_debat_date" ON "transcription_segments" ("debatId", "creeLe")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "transcription_segments"`);
  }
}
