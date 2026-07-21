import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { ReferentielModule } from '../referentiel/referentiel.module';
import { DebatsController } from './controllers/debats.controller';
import { LiveDemoController } from './controllers/live-demo.controller';
import { AffirmationDebat } from './entities/affirmation-debat.entity';
import { Debat } from './entities/debat.entity';
import { ParticipationDebat } from './entities/participation-debat.entity';
import { SignalementDebat } from './entities/signalement-debat.entity';
import { VoteAffirmation } from './entities/vote-affirmation.entity';
import { DebatsGateway } from './gateway/debats.gateway';
import { DebatsService } from './services/debats.service';
import { LiveService } from './services/live.service';
import { LivekitService } from './services/livekit.service';

/**
 * Module Débats & Lives Encadrés (CDC §6.4) — priorité v1, Dev B.
 * REST : planification/gestion, affirmations, signalements, replay.
 * WebSocket (namespace /debats) : salle live — votes en direct, signalements.
 * Émet notif.debat.demarre (Dev A) ; le résumé post-débat (IA + validation,
 * événement debat.resume.valide) arrive à l'étape suivante.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Debat,
      ParticipationDebat,
      AffirmationDebat,
      VoteAffirmation,
      SignalementDebat,
      User, // lecture seule : validation du modérateur désigné
    ]),
    // Repositories Thematique (rattachement des débats)
    ReferentielModule,
  ],
  controllers: [DebatsController, LiveDemoController],
  providers: [DebatsService, LiveService, DebatsGateway, LivekitService],
  exports: [TypeOrmModule],
})
export class DebatsModule {}
