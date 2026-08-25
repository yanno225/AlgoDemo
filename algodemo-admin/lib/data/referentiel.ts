import { apiFetch } from "@/lib/api/client";

/**
 * Référentiel — branché sur l'API NestJS (module Référentiel).
 *
 * La hiérarchie complète (thématiques › critères › indicateurs) tient en un
 * seul appel à `GET /thematiques/arbre` : ~90 indicateurs, un volume pour
 * lequel découper en requêtes fines coûterait plus qu'il ne rapporte. Les
 * pages filtrent ensuite localement.
 */

export interface IndicateurRef {
  id: string;
  libelle: string;
}

export interface CritereRef {
  id: string;
  libelle: string;
  indicateurs: IndicateurRef[];
}

export interface ThematiqueRef {
  id: string;
  libelle: string;
  criteres: CritereRef[];
}

/** Valeur publiée d'un indicateur (table `valeurs_indicateurs`). */
export interface ValeurIndicateur {
  id: string;
  valeur: number;
  dateMesure: string;
  paysOuZone: string;
  source: string;
}

/** Hiérarchie complète, triée alphabétiquement à chaque niveau par l'API. */
export function arbre(): Promise<ThematiqueRef[]> {
  return apiFetch<ThematiqueRef[]>("/thematiques/arbre");
}

/** Une thématique et son sous-arbre, ou null si l'UUID est inconnu. */
export async function getThematique(id: string): Promise<ThematiqueRef | null> {
  const thematiques = await arbre();
  return thematiques.find((thematique) => thematique.id === id) ?? null;
}

/** Un indicateur replacé dans sa hiérarchie (fil d'Ariane, retours). */
export async function getIndicateur(id: string): Promise<{
  thematique: ThematiqueRef;
  critere: CritereRef;
  indicateur: IndicateurRef;
} | null> {
  const thematiques = await arbre();
  for (const thematique of thematiques) {
    for (const critere of thematique.criteres) {
      const indicateur = critere.indicateurs.find((item) => item.id === id);
      if (indicateur) return { thematique, critere, indicateur };
    }
  }
  return null;
}

/**
 * Valeurs publiées d'un indicateur, tous pays confondus — celles que la
 * Fiche-pays affiche aux citoyens (issues de la collecte, après validation).
 */
export function getValeursIndicateur(
  indicateurId: string,
): Promise<ValeurIndicateur[]> {
  return apiFetch<ValeurIndicateur[]>("/valeurs-indicateurs", {
    parametres: { indicateurId },
  });
}
