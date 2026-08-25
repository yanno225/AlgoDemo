import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnthropicIaService } from './anthropic-ia.service';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { IaService, IA_SERVICE } from './ia-service.interface';
import { MistralIaService } from './mistral-ia.service';
import { StubIaService } from './stub-ia.service';

/**
 * Module IA partagé (contrat n°4) — consommé par la Fiche-pays (synthèses),
 * les Résumés de débats et le module Collecte.
 *
 * Le fournisseur est choisi automatiquement au démarrage, par ordre de
 * priorité :
 *  1. ANTHROPIC_API_KEY présente → AnthropicIaService (Claude — cible du projet)
 *  2. MISTRAL_API_KEY présente   → MistralIaService (Mistral AI)
 *  3. sinon                      → StubIaService (mode simulation, hors-ligne)
 */
@Module({
  // L'assistant citoyen de vérification des faits vit ici : il est le premier
  // consommateur "grand public" du service IA partagé.
  controllers: [AssistantController],
  providers: [
    AssistantService,
    StubIaService,
    MistralIaService,
    AnthropicIaService,
    {
      provide: IA_SERVICE,
      inject: [ConfigService, StubIaService, MistralIaService, AnthropicIaService],
      useFactory: (
        config: ConfigService,
        stub: StubIaService,
        mistral: MistralIaService,
        anthropic: AnthropicIaService,
      ): IaService => {
        if (config.get<string>('ANTHROPIC_API_KEY')) {
          Logger.log(
            `Service IA : Claude (clé Anthropic détectée, modèle ${config.get<string>('ANTHROPIC_MODEL', 'claude-opus-5')})`,
            'IaModule',
          );
          return anthropic;
        }
        if (config.get<string>('MISTRAL_API_KEY')) {
          Logger.log('Service IA : Mistral AI (clé détectée)', 'IaModule');
          return mistral;
        }
        Logger.log(
          'Service IA : SIMULATION (aucune clé ANTHROPIC_API_KEY ni MISTRAL_API_KEY — extraction et textes simulés)',
          'IaModule',
        );
        return stub;
      },
    },
  ],
  exports: [IA_SERVICE],
})
export class IaModule {}
