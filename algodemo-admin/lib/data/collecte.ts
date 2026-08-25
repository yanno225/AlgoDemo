import { apiFetch } from "@/lib/api/client";
import type {
  LigneTriangulation,
  PropositionValeur,
  SourceAutorisee,
  StatutProposition,
} from "@/lib/domain/types";

/**
 * Collecte / veille — branché sur l'API NestJS (module `collecte`).
 *
 * Contrairement aux autres fichiers de `lib/data`, il n'y a ici AUCUNE donnée
 * mockée : ces écrans pilotent la validation humaine des chiffres publiés,
 * ils n'auraient aucun sens sur des données fictives.
 */

/** File des propositions, la plus récemment collectée en tête. */
export function listPropositions(
  statut?: StatutProposition,
  pays?: string,
): Promise<PropositionValeur[]> {
  return apiFetch<PropositionValeur[]>("/collecte/propositions", {
    parametres: { statut, pays },
  });
}

/** Vue triangulation : par indicateur, ce que dit chaque source. */
export function listTriangulation(
  pays?: string,
): Promise<LigneTriangulation[]> {
  return apiFetch<LigneTriangulation[]>("/collecte/triangulation", {
    parametres: { pays },
  });
}

/** Liste blanche des sources (actives et désactivées). */
export function listSourcesAutorisees(): Promise<SourceAutorisee[]> {
  return apiFetch<SourceAutorisee[]>("/collecte/sources");
}

/**
 * Compteurs des onglets. Une seule requête : les propositions portent leur
 * statut, on compte côté serveur de rendu plutôt que d'appeler trois fois.
 */
export async function getCollecteCounts(pays?: string) {
  const propositions = await listPropositions(undefined, pays);
  return {
    enAttente: propositions.filter((p) => p.statut === "EN_ATTENTE").length,
    validees: propositions.filter((p) => p.statut === "VALIDEE").length,
    rejetees: propositions.filter((p) => p.statut === "REJETEE").length,
  };
}
