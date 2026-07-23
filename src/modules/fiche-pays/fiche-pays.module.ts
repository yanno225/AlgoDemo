import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IaModule } from '../ia/ia.module';
import { ReferentielModule } from '../referentiel/referentiel.module';
import { FichePaysController } from './controllers/fiche-pays.controller';
import { SynthesesController } from './controllers/syntheses.controller';
import { ValeursIndicateursController } from './controllers/valeurs-indicateurs.controller';
import { ArticleIndicateur } from './entities/article-indicateur.entity';
import { Synthese } from './entities/synthese.entity';
import { ValeurIndicateur } from './entities/valeur-indicateur.entity';
import { FichePaysService } from './services/fiche-pays.service';
import { SynthesesService } from './services/syntheses.service';
import { ValeursIndicateursService } from './services/valeurs-indicateurs.service';

/**
 * Module Fiche-pays (CDC §3.6) : valeurs d'indicateurs, consultation par pays,
 * synthèses IA avec validation humaine. S'appuie sur le Référentiel (squelette)
 * et le module IA partagé. Étape suivante : audio TTS (service du Dev A).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ValeurIndicateur, Synthese, ArticleIndicateur]),
    // Donne accès aux repositories Thematique/Critere/Indicateur
    ReferentielModule,
    IaModule,
  ],
  controllers: [
    FichePaysController,
    ValeursIndicateursController,
    SynthesesController,
  ],
  providers: [FichePaysService, ValeursIndicateursService, SynthesesService],
  exports: [TypeOrmModule],
})
export class FichePaysModule {}
