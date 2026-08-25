import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Interactions citoyennes sur le feed (format immersif, §6.2) :
 *  - reactions_contenu    : « j'aime » (bascule, unique par personne/contenu)
 *  - commentaires_contenu : commentaires publiés immédiatement, modérés
 *    a posteriori (suppression par les gestionnaires)
 */
export class CreateInteractionsFeed1754500000000 implements MigrationInterface {
  name = 'CreateInteractionsFeed1754500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "reactions_contenu" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "contenuId" uuid NOT NULL,
        "cree_le" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reactions_contenu" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_reaction_user_contenu" UNIQUE ("user_id", "contenuId"),
        CONSTRAINT "FK_reaction_contenu" FOREIGN KEY ("contenuId")
          REFERENCES "contenus"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_reactions_contenu_user" ON "reactions_contenu" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "commentaires_contenu" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "auteur_id" uuid NOT NULL,
        "contenuId" uuid NOT NULL,
        "texte" text NOT NULL,
        "cree_le" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_commentaires_contenu" PRIMARY KEY ("id"),
        CONSTRAINT "FK_commentaire_contenu" FOREIGN KEY ("contenuId")
          REFERENCES "contenus"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_commentaires_contenu_auteur" ON "commentaires_contenu" ("auteur_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_commentaires_contenu_contenu" ON "commentaires_contenu" ("contenuId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "commentaires_contenu"`);
    await queryRunner.query(`DROP TABLE "reactions_contenu"`);
  }
}
