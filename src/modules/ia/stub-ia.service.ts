import { Injectable, Logger } from '@nestjs/common';
import {
  DonneesReformulation,
  DonneesResumeDebat,
  DonneesSynthese,
  IaService,
  IndicateurConnu,
  PropositionValeur,
} from './ia-service.interface';

/**
 * ⚠️ IMPLÉMENTATION PROVISOIRE (stub) du service IA.
 *
 * Produit un texte mécanique à partir des données réelles, sans appel
 * externe : gratuit, instantané, hors-ligne. Elle permet de développer et
 * tester tout le circuit « génération → validation admin → publication ».
 *
 * À REMPLACER par AnthropicIaService (SDK Anthropic + ANTHROPIC_API_KEY)
 * dans ia.module.ts — une seule ligne à changer, le reste ne bouge pas.
 */
@Injectable()
export class StubIaService implements IaService {
  private readonly logger = new Logger(StubIaService.name);

  genererSyntheseThematique(donnees: DonneesSynthese): Promise<string> {
    this.logger.warn(
      `Génération STUB (sans IA réelle) — thématique « ${donnees.thematique} », ${donnees.paysOuZone}`,
    );

    const phrases: string[] = [
      `Synthèse de la thématique « ${donnees.thematique} » — ${donnees.paysOuZone}.`,
    ];

    const renseignes = donnees.indicateurs.filter((i) => i.valeurs.length > 0);
    if (renseignes.length === 0) {
      phrases.push(
        "Aucune donnée mesurée n'est encore disponible pour cette thématique.",
      );
    }

    for (const item of renseignes) {
      const premiere = item.valeurs[0];
      const derniere = item.valeurs[item.valeurs.length - 1];
      if (item.valeurs.length === 1) {
        phrases.push(
          `${item.indicateur} : ${derniere.valeur} (${this.annee(derniere.dateMesure)}).`,
        );
      } else {
        const tendance =
          derniere.valeur > premiere.valeur
            ? 'en hausse'
            : derniere.valeur < premiere.valeur
              ? 'en baisse'
              : 'stable';
        phrases.push(
          `${item.indicateur} : ${derniere.valeur} en ${this.annee(derniere.dateMesure)}, ` +
            `contre ${premiere.valeur} en ${this.annee(premiere.dateMesure)} (${tendance}).`,
        );
      }
    }

    phrases.push(
      '[Texte généré par le service de démonstration — la rédaction par IA (Claude) sera branchée ultérieurement.]',
    );
    return Promise.resolve(phrases.join(' '));
  }

  extraireValeurs(
    _texteBrut: string,
    _indicateursConnus: IndicateurConnu[],
  ): Promise<PropositionValeur[]> {
    // Le stub n'extrait rien : cette méthode prendra vie avec le module
    // Collecte (scraping) et l'implémentation Anthropic.
    this.logger.warn('extraireValeurs STUB appelé — aucune extraction réelle');
    return Promise.resolve([]);
  }

  genererResumeDebat(donnees: DonneesResumeDebat): Promise<string> {
    this.logger.warn(
      `Génération STUB (sans IA réelle) — résumé du débat « ${donnees.titre} »`,
    );
    const phrases: string[] = [
      `Résumé du débat « ${donnees.titre} » (thématique : ${donnees.thematique}).`,
    ];
    if (donnees.transcription.length > 0) {
      phrases.push(
        `${donnees.transcription.length} prise(s) de parole transcrite(s).`,
      );
    }
    if (donnees.affirmations.length === 0) {
      phrases.push("Aucune affirmation n'a été soumise au vote.");
    }
    for (const a of donnees.affirmations) {
      const total = a.valides + a.invalides;
      const pct = total ? Math.round((100 * a.valides) / total) : 0;
      const verdict =
        total === 0
          ? 'sans vote'
          : a.valides > a.invalides
            ? `jugée plutôt vraie (${pct}% de votes favorables)`
            : `jugée plutôt fausse (${100 - pct}% de votes défavorables)`;
      phrases.push(`« ${a.texte} » — ${verdict}.`);
    }
    phrases.push(
      '[Texte généré par le service de démonstration — la rédaction par IA sera branchée ultérieurement.]',
    );
    return Promise.resolve(phrases.join(' '));
  }

  reformulerIndicateur(donnees: DonneesReformulation): Promise<string> {
    const recentes = [...donnees.sources].sort((a, b) =>
      b.annee.localeCompare(a.annee),
    );
    const plusRecente = recentes[0];
    const details = donnees.sources
      .map((s) => `${s.source.split(' — ')[0]} : ${s.valeur} (${s.annee})`)
      .join(' ; ');
    return Promise.resolve(
      `${donnees.indicateur} — ${donnees.paysOuZone} : ` +
        (plusRecente
          ? `${plusRecente.valeur} (${plusRecente.annee}). Sources : ${details}.`
          : 'aucune donnée collectée.') +
        ' [Reformulation de démonstration — IA réelle à venir.]',
    );
  }

  /** "2024-01-01" → "2024" */
  private annee(dateMesure: string): string {
    return dateMesure.slice(0, 4);
  }
}
