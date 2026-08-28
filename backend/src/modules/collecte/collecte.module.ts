import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FichePaysModule } from '../fiche-pays/fiche-pays.module';
import { IaModule } from '../ia/ia.module';
import { ReferentielModule } from '../referentiel/referentiel.module';
import { CollecteController } from './controllers/collecte.controller';
import { SourcesAutoriseesController } from './controllers/sources-autorisees.controller';
import { PropositionValeur } from './entities/proposition-valeur.entity';
import { SourceAutorisee } from './entities/source-autorisee.entity';
import { BanqueMondialeConnector } from './services/banque-mondiale.connector';
import { CollecteService } from './services/collecte.service';
import { OmsConnector } from './services/oms.connector';
import { RsfConnector } from './services/rsf.connector';
import { SOURCE_CONNECTORS } from './services/source-connector.interface';
import { SourcesAutoriseesService } from './services/sources-autorisees.service';

/**
 * Module Collecte / Veille (CDC §3.8) — Dev B.
 * Jobs planifiés (cron) qui interrogent en continu PLUSIEURS sources ouvertes
 * (Banque Mondiale, OMS…) — pur HTTP, aucun token IA — plus l'ingestion de
 * texte via l'IA. Chaque valeur passe par une PropositionValeur (validation
 * admin + triangulation) avant d'entrer dans la Fiche-pays.
 *
 * Ajouter une source = créer un connecteur (SourceConnector) et l'ajouter au
 * tableau SOURCE_CONNECTORS ci-dessous. Rien d'autre à changer.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PropositionValeur, SourceAutorisee]),
    ReferentielModule, // repository Indicateur
    FichePaysModule, // repository ValeurIndicateur (cible des validations)
    IaModule, // extraction de valeurs depuis un texte
  ],
  controllers: [CollecteController, SourcesAutoriseesController],
  providers: [
    CollecteService,
    SourcesAutoriseesService,
    BanqueMondialeConnector,
    OmsConnector,
    RsfConnector,
    {
      provide: SOURCE_CONNECTORS,
      inject: [BanqueMondialeConnector, OmsConnector, RsfConnector],
      useFactory: (
        bm: BanqueMondialeConnector,
        oms: OmsConnector,
        rsf: RsfConnector,
      ) => [bm, oms, rsf],
    },
  ],
})
export class CollecteModule {}
