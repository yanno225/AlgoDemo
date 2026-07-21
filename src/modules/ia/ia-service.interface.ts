/**
 * CONTRAT n°4 — Service IA partagé (NLP).
 *
 * Cette interface est DÉFINITIVE : elle sera consommée par la Fiche-pays
 * (synthèses), les Résumés de débats et le futur module Collecte (extraction
 * des valeurs depuis les textes scrapés). Seule l'implémentation changera :
 *  - aujourd'hui : StubIaService (texte mécanique, aucune dépendance externe)
 *  - demain     : AnthropicIaService (appels réels à Claude via ANTHROPIC_API_KEY)
 */

/** Jeton d'injection NestJS : @Inject(IA_SERVICE) */
export const IA_SERVICE = 'IA_SERVICE';

/** Données transmises à l'IA pour rédiger la synthèse d'une thématique/pays */
export interface DonneesSynthese {
  paysOuZone: string;
  thematique: string;
  indicateurs: {
    critere: string;
    indicateur: string;
    /** Mesures triées de la plus ancienne à la plus récente */
    valeurs: { valeur: number; dateMesure: string }[];
  }[];
}

/** Référence d'un indicateur connu du référentiel (liste fermée des ateliers) */
export interface IndicateurConnu {
  id: string;
  libelle: string;
}

/** Valeur extraite d'un texte scrapé, proposée pour validation admin */
export interface PropositionValeur {
  indicateurId: string;
  valeur: number;
  dateMesure: string;
  source: string;
}

export interface IaService {
  /**
   * Rédige la synthèse d'une thématique pour un pays à partir des valeurs
   * mesurées. Le texte produit est un BROUILLON : il part toujours en
   * validation admin avant publication.
   */
  genererSyntheseThematique(donnees: DonneesSynthese): Promise<string>;

  /**
   * Analyse un texte brut (page scrapée, rapport) et en extrait les valeurs
   * chiffrées, rattachées aux indicateurs CONNUS du référentiel — l'IA ne
   * crée jamais de nouvel indicateur. Consommé par le futur module Collecte.
   */
  extraireValeurs(
    texteBrut: string,
    indicateursConnus: IndicateurConnu[],
  ): Promise<PropositionValeur[]>;
}
