import { Injectable, Logger } from '@nestjs/common';
import {
  DonneesReformulation,
  DonneesResumeDebat,
  DonneesSynthese,
  DonneesVerification,
  IaService,
  IndicateurConnu,
  PropositionValeur,
  ResultatVerification,
} from './ia-service.interface';

/**
 * Termes trop répandus dans le référentiel pour identifier un indicateur à eux
 * seuls (≈ 90 libellés partagent ce vocabulaire). Ils comptent dans le score
 * mais ne peuvent pas déclencher un rattachement à eux seuls.
 */
const MOTS_GENERIQUES = new Set([
  'nombre',
  'jeunes',
  'moyenne',
  'moyen',
  'nationale',
  'national',
  'annuel',
  'annuelle',
  'general',
  'generale',
  'generales',
  'population',
  'personnes',
]);

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

  /**
   * MODE SIMULATION : extraction hors-ligne, déterministe, sans appel externe.
   * Repère les phrases du texte qui mentionnent un indicateur connu (mots
   * significatifs du libellé) ET un chiffre, et en fait une proposition avec
   * citation — même format que l'extraction Claude, pour tester tout le
   * pipeline (ingestion → proposition → triangulation → validation) sans clé.
   */
  extraireValeurs(
    texteBrut: string,
    indicateursConnus: IndicateurConnu[],
  ): Promise<PropositionValeur[]> {
    this.logger.warn(
      'extraireValeurs SIMULATION — analyse lexicale hors-ligne (sans IA réelle)',
    );
    const phrases = texteBrut
      .split(/(?<=[.!?])\s+|\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    // Une phrase rapporte UN indicateur : on attribue chaque phrase au
    // meilleur candidat, plutôt que de laisser chaque indicateur se servir.
    // Sans cela, un mot générique partagé (« jeunes ») rattacherait la même
    // valeur à tous les indicateurs de la famille.
    const resultats: PropositionValeur[] = [];
    const dejaVus = new Set<string>();

    for (const phrase of phrases) {
      const valeur = this.premierNombre(phrase);
      if (valeur === null) continue;

      const normalisee = this.normaliser(phrase);
      let meilleur: IndicateurConnu | undefined;
      let meilleurScore = 0;

      for (const indicateur of indicateursConnus) {
        const mots = this.motsSignificatifs(indicateur.libelle);
        if (mots.length === 0) continue;

        const trouves = mots.filter((m) => normalisee.includes(m));
        // Un mot discriminant est exigé : les termes passe-partout du
        // référentiel (« taux », « jeunes »…) ne suffisent pas à identifier
        // un indicateur.
        if (!trouves.some((m) => !MOTS_GENERIQUES.has(m))) continue;

        // Proportion du libellé retrouvée : départage « Taux de chômage chez
        // les jeunes » et « Taux de pauvreté chez les jeunes ».
        const score = trouves.length / mots.length;
        if (score > meilleurScore) {
          meilleurScore = score;
          meilleur = indicateur;
        }
      }

      if (!meilleur || meilleurScore < 0.5 || dejaVus.has(meilleur.id)) continue;
      dejaVus.add(meilleur.id);

      const annee = /(?:19|20)\d{2}/.exec(phrase)?.[0];
      resultats.push({
        indicateurId: meilleur.id,
        valeur,
        dateMesure: `${annee ?? String(new Date().getFullYear())}-01-01`,
        source: 'Simulation (sans IA) — à vérifier',
        extrait: phrase.slice(0, 300),
      });
    }
    return Promise.resolve(resultats);
  }

  /** Mots porteurs de sens d'un libellé (≥ 6 caractères, sans accents) */
  verifierAffirmation(
    donnees: DonneesVerification,
  ): Promise<ResultatVerification> {
    this.logger.warn('Vérification STUB (sans IA réelle) — mode simulation');

    // Sans IA, aucun jugement : on remonte honnêtement les données dont le
    // vocabulaire recoupe l'affirmation, pour que le citoyen vérifie lui-même.
    const motsAffirmation = new Set(
      this.normaliser(donnees.affirmation)
        .split(/\W+/)
        .filter((mot) => mot.length > 3 && !MOTS_GENERIQUES.has(mot)),
    );
    const pertinents = donnees.donnees
      .filter((d) =>
        this.motsSignificatifs(`${d.indicateur} ${d.critere}`).some((mot) =>
          motsAffirmation.has(mot),
        ),
      )
      .slice(0, 3);
    const referencesPertinentes = donnees.references
      .filter((r) =>
        this.motsSignificatifs(r.titre).some((mot) => motsAffirmation.has(mot)),
      )
      .slice(0, 2);

    return Promise.resolve({
      verdict: 'NON_VERIFIABLE' as const,
      explication:
        pertinents.length > 0 || referencesPertinentes.length > 0
          ? 'Mode simulation (aucune clé IA configurée) : impossible de juger cette affirmation automatiquement. ' +
            'Voici les éléments validés dont le sujet se rapproche — comparez-les vous-même.'
          : 'Mode simulation (aucune clé IA configurée) : impossible de juger cette affirmation, et aucun élément validé ne semble porter sur ce sujet.',
      elements: pertinents,
      references: referencesPertinentes,
      sourcesWeb: [],
      eclairage: null,
    });
  }

  private motsSignificatifs(libelle: string): string[] {
    return this.normaliser(libelle)
      .split(/[^a-z]+/)
      .filter((m) => m.length >= 6);
  }

  private normaliser(texte: string): string {
    return texte
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  /** Premier nombre de la phrase (pourcentage prioritaire, années exclues) */
  private premierNombre(phrase: string): number | null {
    const pourcentage = /(\d+(?:[.,]\d+)?)\s*%/.exec(phrase);
    if (pourcentage) return parseFloat(pourcentage[1].replace(',', '.'));
    for (const m of phrase.matchAll(/\d+(?:[.,]\d+)?/g)) {
      if (/^(?:19|20)\d{2}$/.test(m[0])) continue; // une année n'est pas une valeur
      return parseFloat(m[0].replace(',', '.'));
    }
    return null;
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
