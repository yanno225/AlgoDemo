import { Module } from '@nestjs/common';
import { IA_SERVICE } from './ia-service.interface';
import { StubIaService } from './stub-ia.service';

/**
 * Module IA partagé (contrat n°4) — consommé par la Fiche-pays (synthèses),
 * les futurs Résumés de débats et le futur module Collecte.
 *
 * Pour brancher la vraie IA : remplacer useClass par AnthropicIaService.
 * C'est LA seule ligne à changer dans tout le projet.
 */
@Module({
  providers: [
    {
      provide: IA_SERVICE,
      useClass: StubIaService, // ⚠️ provisoire — AnthropicIaService à terme
    },
  ],
  exports: [IA_SERVICE],
})
export class IaModule {}
