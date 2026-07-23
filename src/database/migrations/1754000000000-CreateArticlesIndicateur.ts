import { MigrationInterface, QueryRunner } from 'typeorm';

/** Cache des articles rédigés par indicateur+pays (fiche-pays détaillée). */
export class CreateArticlesIndicateur1754000000000
  implements MigrationInterface
{
  name = 'CreateArticlesIndicateur1754000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "articles_indicateur" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "indicateurId" uuid NOT NULL,
        "paysOuZone" character varying(100) NOT NULL,
        "texte" text NOT NULL,
        "genereLe" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_articles_indicateur" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_article_indicateur_pays" UNIQUE ("indicateurId", "paysOuZone")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "articles_indicateur"`);
  }
}
