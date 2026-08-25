import { apiClient } from './client';

/**
 * Assistant IA de vérification des faits — fonctionnalité phare.
 *
 * Le backend confronte l'affirmation aux SEULES valeurs d'indicateurs
 * validées de la plateforme (sources tracées) : chaque élément cité ci-dessous
 * provient de ces données, jamais d'une invention du modèle.
 */

export type FactVerdict = 'COHERENT' | 'CONTREDIT' | 'NON_VERIFIABLE';

export interface FactElement {
  thematique: string;
  critere: string;
  indicateur: string;
  paysOuZone: string;
  valeur: number;
  annee: string;
  source: string;
}

/** Texte validé par l'équipe (synthèse publiée, contenu vérifié du feed). */
export interface FactReference {
  titre: string;
  texte: string;
  source: string;
}

/** Source web de la liste blanche consultée pendant la vérification. */
export interface FactWebSource {
  titre: string;
  url: string;
}

export interface FactCheck {
  verdict: FactVerdict;
  explication: string;
  elements: FactElement[];
  references: FactReference[];
  /** Recherche web EN DIRECT, restreinte à la liste blanche des sources. */
  sourcesWeb: FactWebSource[];
  /**
   * Contexte général issu des connaissances du modèle — jamais compté dans
   * le verdict, affiché « non vérifié par nos sources ».
   */
  eclairage: string | null;
}

export async function verifyFact(affirmation: string): Promise<FactCheck> {
  const { data } = await apiClient.post<FactCheck>('/assistant/verifier', {
    affirmation,
  });
  return data;
}
