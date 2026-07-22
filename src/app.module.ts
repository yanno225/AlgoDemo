import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validateEnv } from './config/env.validation';
import { dataSourceOptions } from './config/typeorm-datasource';
import { AuthModule } from './modules/auth/auth.module';
import { BackOfficeModule } from './modules/back-office/back-office.module';
import { CollecteModule } from './modules/collecte/collecte.module';
import { ConsultationsModule } from './modules/consultations/consultations.module';
import { DebatsModule } from './modules/debats/debats.module';
import { FeedModule } from './modules/feed/feed.module';
import { FichePaysModule } from './modules/fiche-pays/fiche-pays.module';
import { MediaModule } from './modules/media/media.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReferentielModule } from './modules/referentiel/referentiel.module';

@Module({
  imports: [
    // Configuration globale : charge .env et valide les variables au démarrage (fail-fast)
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),

    // Connexion PostgreSQL — les options sont partagées avec la CLI TypeORM (migrations).
    // synchronize est INTERDIT : toute évolution de schéma passe par une migration.
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),

    // Communication inter-modules par événements internes (ex. debat.resume.valide → Feed).
    EventEmitterModule.forRoot(),

    // Planificateur des tâches récurrentes (collecte continue).
    ScheduleModule.forRoot(),

    // Socle transverse (Dev A) — doit être importé avant les modules qui dépendent
    // du RolesGuard/JWT global.
    AuthModule,

    // Modules métier.
    ReferentielModule, // Dev B
    FichePaysModule, // Dev B — valeurs d'indicateurs, synthèses IA + validation
    DebatsModule, // Dev B — débats & lives (REST + WebSocket temps réel)
    CollecteModule, // Dev B — collecte/veille continue (cron) → propositions de valeurs
    MediaModule, // Socle transverse — stockage S3 des médias (upload vidéos/images/replays)
    FeedModule, // Dev A
    ConsultationsModule, // Dev A
    NotificationsModule, // Dev A
    BackOfficeModule, // Dev A — dashboard, modération unifiée, journal d'audit (APP_INTERCEPTOR)
  ],
})
export class AppModule {}
