import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Conversations riches sous les contenus du feed (retours mi-parcours) :
 *  - réponses aux commentaires (fil à UN niveau, `parent_id`) ;
 *  - « j'aime » sur les commentaires (bascule, unique par personne).
 */
export class EnrichirCommentairesFeed1755000000000 implements MigrationInterface {
  name = 'EnrichirCommentairesFeed1755000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "commentaires_contenu" ADD "parent_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "commentaires_contenu" ADD CONSTRAINT "FK_commentaire_parent"
         FOREIGN KEY ("parent_id") REFERENCES "commentaires_contenu"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_commentaires_contenu_parent" ON "commentaires_contenu" ("parent_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "reactions_commentaire" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "commentaireId" uuid NOT NULL,
        "cree_le" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reactions_commentaire" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_reaction_user_commentaire" UNIQUE ("user_id", "commentaireId"),
        CONSTRAINT "FK_reaction_commentaire" FOREIGN KEY ("commentaireId")
          REFERENCES "commentaires_contenu"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_reactions_commentaire_user" ON "reactions_commentaire" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "reactions_commentaire"`);
    await queryRunner.query(
      `ALTER TABLE "commentaires_contenu" DROP CONSTRAINT "FK_commentaire_parent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commentaires_contenu" DROP COLUMN "parent_id"`,
    );
  }
}
