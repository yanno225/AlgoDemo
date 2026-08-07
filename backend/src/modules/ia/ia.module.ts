import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IaService, IA_SERVICE } from './ia-service.interface';
import { MistralIaService } from './mistral-ia.service';
import { StubIaService } from './stub-ia.service';

/**
 * Module IA partagé (contrat n°4) — consommé par la Fiche-pays (synthèses),
 * les Résumés de débats et le futur module Collecte.
 *
 * Le fournisseur est choisi automatiquement au démarrage :
 *  - MISTRAL_API_KEY présente → MistralIaService (IA réelle, Mistral AI)
 *  - sinon                    → StubIaService (texte mécanique, repli/dev)
 */
@Module({
  providers: [
    StubIaService,
    MistralIaService,
    {
      provide: IA_SERVICE,
      inject: [ConfigService, StubIaService, MistralIaService],
      useFactory: (
        config: ConfigService,
        stub: StubIaService,
        mistral: MistralIaService,
      ): IaService => {
        const aCle = Boolean(config.get<string>('MISTRAL_API_KEY'));
        Logger.log(
          aCle
            ? 'Service IA : Mistral AI (clé détectée)'
            : 'Service IA : STUB (aucune clé MISTRAL_API_KEY — texte de démonstration)',
          'IaModule',
        );
        return aCle ? mistral : stub;
      },
    },
  ],
  exports: [IA_SERVICE],
})
export class IaModule {}
