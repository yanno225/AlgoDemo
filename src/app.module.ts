import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validateEnv } from './config/env.validation';
import { dataSourceOptions } from './config/typeorm-datasource';
import { FichePaysModule } from './modules/fiche-pays/fiche-pays.module';
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

    // Modules métier — périmètre Dev B.
    // Les modules du Dev A (auth, feed, consultations, notifications) seront ajoutés par lui.
    ReferentielModule,
    FichePaysModule,
  ],
})
export class AppModule {}
