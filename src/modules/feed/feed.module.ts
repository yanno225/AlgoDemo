import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferentielModule } from '../referentiel/referentiel.module';
import { Contenu } from './entities/contenu.entity';
import { HistoriqueLecture } from './entities/historique-lecture.entity';
import { Signalement } from './entities/signalement.entity';
import { FeedController } from './feed.controller';
import { DebatResumeListener } from './listeners/debat-resume.listener';
import { FeedService } from './services/feed.service';
import { SignalementsService } from './services/signalements.service';
import { TtsService } from './services/tts.service';

/**
 * Module Feed / Contenu (CDC §6.1-§6.2, §9.4) — priorité Dev A.
 * Consomme le Référentiel (Dev B) pour le rattachement thématique et publie
 * automatiquement les résumés de débats (Dev B) via l'événement
 * `debat.resume.valide` (voir DebatResumeListener).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Contenu, HistoriqueLecture, Signalement]),
    ReferentielModule, // fournit Repository<Thematique>
  ],
  controllers: [FeedController],
  providers: [FeedService, TtsService, SignalementsService, DebatResumeListener],
  // Exporté pour que le back-office (Dev A) agrège contenus/signalements dans le dashboard
  exports: [TypeOrmModule],
})
export class FeedModule {}
