import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CriteresController } from './controllers/criteres.controller';
import { IndicateursController } from './controllers/indicateurs.controller';
import { ThematiquesController } from './controllers/thematiques.controller';
import { Critere } from './entities/critere.entity';
import { Indicateur } from './entities/indicateur.entity';
import { Thematique } from './entities/thematique.entity';
import { CriteresService } from './services/criteres.service';
import { IndicateursService } from './services/indicateurs.service';
import { ThematiquesService } from './services/thematiques.service';

/**
 * Module Référentiel d'évaluation démocratique — socle partagé (CDC §5).
 * Hiérarchie : Thématique › Critère › Indicateur.
 * Consommé par : Feed (filtres, Dev A), Avis, Débats et Fiche-pays (Dev B).
 */
@Module({
  imports: [TypeOrmModule.forFeature([Thematique, Critere, Indicateur])],
  controllers: [ThematiquesController, CriteresController, IndicateursController],
  providers: [ThematiquesService, CriteresService, IndicateursService],
  // Exporté pour que les futurs modules (Fiche-pays, Débats) réutilisent les repositories
  exports: [TypeOrmModule],
})
export class ReferentielModule {}
