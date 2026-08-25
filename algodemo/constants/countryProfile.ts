/**
 * Fiche pays — modèle d'affichage des indicateurs de santé démocratique.
 *
 * Les DONNÉES viennent exclusivement du backend (GET /fiche-pays/{pays}) via
 * `services/api/fichePays.ts` — ce fichier ne porte plus que les TYPES et
 * quelques accès dérivés. Le jeu de données illustratif d'origine a été
 * supprimé le jour où les valeurs réelles (Banque mondiale, sources des
 * ateliers) sont entrées en base : plus rien d'inventé ne s'affiche.
 */

import type { lightColors } from './theme';

/** Une mesure datée d'un indicateur — miroir du `valeurs[]` du backend. */
export interface IndicatorValue {
  valeur: number;
  /** Date de mesure, ISO `AAAA-MM-JJ` (comme le backend). */
  dateMesure: string;
  source: string;
}

export interface CountryIndicator {
  id: string;
  /** Libellé court de l'indicateur. */
  labelKey: string;
  /** Ce que mesure l'indicateur (affiché dans le détail). */
  description: string;
  /** Unité de la valeur : `%`, ` ans`, ` ‰`… — `''` pour un décompte brut. */
  unit: string;
  /**
   * Sens de lecture : `up` = « plus c'est haut, mieux c'est » (participation),
   * `down` = « plus c'est bas, mieux c'est » (cas de violences, chômage).
   * Détermine la couleur de la tendance dans le détail.
   */
  goodDirection: 'up' | 'down';
  /** Historique des mesures, du plus récent au plus ancien. */
  history: IndicatorValue[];
}

export interface CountryDomain {
  /** Identifiant backend de la thématique. */
  id: string;
  /** Libellé de la thématique (celui du référentiel des ateliers). */
  sectionTitleKey: string;
  /** Jeton de couleur de la thématique dans `colors.thematic`. */
  colorToken: keyof typeof lightColors.thematic;
  /** Synthèse validée par l'équipe pour cette thématique — null sinon. */
  synthesis: string | null;
  /** Nombre de sources distinctes derrière les mesures de la thématique. */
  sourceCount: number;
  /** Indicateurs disposant d'au moins une mesure réelle. */
  indicators: CountryIndicator[];
}

export interface CountryProfile {
  name: string;
  /** Emoji drapeau, utilisé comme repère visuel léger. */
  flag: string;
  /** Date de la mesure la plus récente, déjà formatée pour l'affichage. */
  updatedAt: string;
  /**
   * Fait marquant CALCULÉ depuis les mesures réelles (la plus forte
   * progression) — null si les séries ne permettent pas d'en dégager un.
   */
  didYouKnow: string | null;
  domains: CountryDomain[];
}

// ─── Accès dérivés (l'écran lit la valeur courante, pas tout l'historique) ──

/** Dernière valeur mesurée d'un indicateur (l'entrée la plus récente). */
export const latestValue = (indicator: CountryIndicator): number =>
  indicator.history[0]?.valeur ?? 0;

/** Source de la dernière mesure. */
export const latestSource = (indicator: CountryIndicator): string =>
  indicator.history[0]?.source ?? '';

/**
 * Variation entre les deux dernières mesures, en points.
 * `null` si l'historique ne compte qu'une seule valeur.
 */
export const latestDelta = (indicator: CountryIndicator): number | null => {
  if (indicator.history.length < 2) return null;
  return (
    Math.round((indicator.history[0].valeur - indicator.history[1].valeur) * 10) / 10
  );
};
