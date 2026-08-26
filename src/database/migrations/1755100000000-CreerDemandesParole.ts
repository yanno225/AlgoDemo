import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Prise de parole des citoyens pendant un live (« main levée », CDC §6.4) :
 * le citoyen demande, le modérateur accorde depuis la console web, le
 * citoyen monte « à la tribune » puis redescend. Chaque étape est conservée
 * et horodatée — journal d'audit des prises de parole d'un événement public.
 */
export class CreerDemandesParole1755100000000 implements MigrationInterface {
  name = 'CreerDemandesParole1755100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "demandes_parole" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "debatId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "statut" character varying(20) NOT NULL DEFAULT 'EN_ATTENTE',
        "decidePar" uuid,
        "creeLe" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "majLe" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_demandes_parole" PRIMARY KEY ("id"),
        CONSTRAINT "FK_demande_parole_debat" FOREIGN KEY ("debatId")
          REFERENCES "debats"("id") ON DELETE CASCADE
      )
    `);
    // Lecture nominale : la file (EN_ATTENTE) et la tribune (ACCORDEE) d'UN débat.
    await queryRunner.query(
      `CREATE INDEX "IDX_demandes_parole_debat_statut" ON "demandes_parole" ("debatId", "statut")`,
    );
    // Une seule demande VIVANTE (en attente ou à la tribune) par citoyen et
    // par débat — garanti par la base, pas seulement par le service.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_demandes_parole_active_unique"
         ON "demandes_parole" ("debatId", "userId")
         WHERE "statut" IN ('EN_ATTENTE', 'ACCORDEE')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "demandes_parole"`);
  }
}
