import { apiFetch } from "@/lib/api/client";

/**
 * Signalements citoyens de terrain — module backend `participation`.
 * La file complète est réservée aux gestionnaires (POINT_FOCAL/ADMIN).
 */

export type StatutSignalementCitoyen = "RECU" | "EN_COURS" | "RESOLU" | "REJETE";

export type CategorieSignalement =
  | "VOIRIE"
  | "ECLAIRAGE"
  | "DECHETS"
  | "EAU"
  | "SECURITE"
  | "DESINFORMATION"
  | "AUTRE";

export const LIBELLES_CATEGORIES: Record<CategorieSignalement, string> = {
  VOIRIE: "Voirie",
  ECLAIRAGE: "Éclairage",
  DECHETS: "Déchets",
  EAU: "Eau",
  SECURITE: "Sécurité",
  DESINFORMATION: "Désinformation",
  AUTRE: "Autre",
};

export interface SignalementCitoyenAdmin {
  id: string;
  auteurId: string;
  categorie: CategorieSignalement;
  description: string;
  adresse: string;
  latitude: number | null;
  longitude: number | null;
  urlPhoto: string | null;
  statut: StatutSignalementCitoyen;
  traiteLe: string | null;
  creeLe: string;
}

export function listSignalementsCitoyens(): Promise<SignalementCitoyenAdmin[]> {
  return apiFetch<SignalementCitoyenAdmin[]>("/participation/signalements");
}
