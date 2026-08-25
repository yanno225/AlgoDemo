import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * SECRET DU VOTE (CDC §6.3) — scinde `votes` en deux tables sans lien.
 *
 * Avant : une ligne portait à la fois `user_id` et `optionId`, donc la base
 * répondait à « qui a voté quoi ». Après :
 *  - `participations_consultation` = l'émargement (qui a voté), qui garantit
 *    l'unicité du vote ;
 *  - `bulletins` = le choix exprimé, sans aucune référence au votant.
 *
 * ⚠️ MIGRATION IRRÉVERSIBLE PAR CONCEPTION. Les votes existants sont
 * transférés dans les deux tables, puis `votes` est supprimée : le lien
 * votant → option est définitivement perdu, c'est précisément le but. Les
 * résultats agrégés et la liste des votants sont, eux, intégralement
 * préservés. `down()` échoue volontairement (voir plus bas).
 */
export class SecretDuVote1754400000000 implements MigrationInterface {
  name = 'SecretDuVote1754400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "participations_consultation" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "consultationId" uuid NOT NULL,
        "participe_le" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_participations_consultation" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_participation_user_consultation" UNIQUE ("user_id", "consultationId"),
        CONSTRAINT "FK_participation_consultation" FOREIGN KEY ("consultationId")
          REFERENCES "consultations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "bulletins" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "consultationId" uuid NOT NULL,
        "optionId" uuid NOT NULL,
        "depose_le" date NOT NULL DEFAULT CURRENT_DATE,
        CONSTRAINT "PK_bulletins" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bulletin_consultation" FOREIGN KEY ("consultationId")
          REFERENCES "consultations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bulletin_option" FOREIGN KEY ("optionId")
          REFERENCES "consultation_options"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_bulletins_consultation" ON "bulletins" ("consultationId")`,
    );

    // Reprise des votes déjà exprimés — l'émargement conserve son horodatage.
    await queryRunner.query(`
      INSERT INTO "participations_consultation" ("user_id", "consultationId", "participe_le")
      SELECT "user_id", "consultationId", "vote_le" FROM "votes"
    `);

    // Les bulletins sont réinsérés dans un ORDRE ALÉATOIRE et datés au jour :
    // sans cela, l'ordre des lignes ou leur horodatage permettrait de les
    // réapparier aux émargements, et la séparation ne servirait à rien.
    await queryRunner.query(`
      INSERT INTO "bulletins" ("consultationId", "optionId", "depose_le")
      SELECT "consultationId", "optionId", "vote_le"::date
      FROM "votes" ORDER BY random()
    `);

    await queryRunner.query(`DROP TABLE "votes"`);
  }

  public async down(): Promise<void> {
    // Rejouer cette migration à l'envers supposerait de savoir qui a déposé
    // quel bulletin — information volontairement détruite. Échouer bruyamment
    // vaut mieux que recréer une table `votes` vide en laissant croire que les
    // votes ont été restaurés.
    throw new Error(
      "SecretDuVote1754400000000 est irréversible : le lien votant → bulletin " +
        'a été détruit à dessein (secret du vote, CDC §6.3). Pour revenir en ' +
        'arrière, restaurez une sauvegarde antérieure à la migration.',
    );
  }
}
