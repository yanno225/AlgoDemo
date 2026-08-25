import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Signalements citoyens de terrain (CDC §6.1) : catégorie fermée, adresse,
 * position GPS facultative, photo MinIO facultative, cycle de vie
 * RECU → EN_COURS → RESOLU/REJETE tracé (qui, quand).
 */
export class CreerSignalementsCitoyens1754800000000
  implements MigrationInterface
{
  name = 'CreerSignalementsCitoyens1754800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "categorie_signalement_enum" AS ENUM (
        'VOIRIE','ECLAIRAGE','DECHETS','EAU','SECURITE','DESINFORMATION','AUTRE'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "statut_signalement_citoyen_enum" AS ENUM (
        'RECU','EN_COURS','RESOLU','REJETE'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "signalements_citoyens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "auteurId" uuid NOT NULL,
        "categorie" "categorie_signalement_enum" NOT NULL,
        "description" text NOT NULL,
        "adresse" character varying(300) NOT NULL,
        "latitude" double precision,
        "longitude" double precision,
        "urlPhoto" character varying(1000),
        "statut" "statut_signalement_citoyen_enum" NOT NULL DEFAULT 'RECU',
        "traiteParUserId" uuid,
        "traiteLe" TIMESTAMP WITH TIME ZONE,
        "creeLe" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_signalements_citoyens" PRIMARY KEY ("id")
      )
    `);
    // Les deux lectures nominales : le fil public récent et « mes signalements ».
    await queryRunner.query(
      `CREATE INDEX "IDX_signalements_citoyens_date" ON "signalements_citoyens" ("creeLe")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_signalements_citoyens_auteur" ON "signalements_citoyens" ("auteurId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "signalements_citoyens"`);
    await queryRunner.query(`DROP TYPE "statut_signalement_citoyen_enum"`);
    await queryRunner.query(`DROP TYPE "categorie_signalement_enum"`);
  }
}
