import { apiFetch } from "@/lib/api/client";

/**
 * Débats & consultations — branchés sur l'API NestJS.
 *
 * Les types reprennent les noms français du backend, servis tels quels :
 * la couche maquette (`debates.ts`) portait des champs qui n'existent
 * nulle part (intervenants, participants, taux de participation) — elle
 * est remplacée, pas traduite.
 */

export type StatutDebat = "PLANIFIE" | "EN_COURS" | "TERMINE" | "ANNULE";

export interface DebatAdmin {
  id: string;
  titre: string;
  description: string | null;
  statut: StatutDebat;
  dateDebut: string;
  urlReplay: string | null;
  /** Couverture MinIO — c'est elle qui distingue les lives simultanés. */
  urlCouverture: string | null;
  moderateurId: string | null;
  thematique: { id: string; libelle: string } | null;
  creeLe: string;
}

export interface ConsultationAdmin {
  id: string;
  /** SONDAGE = question rapide (onglet dédié mobile), même vote secret. */
  type: "CONSULTATION" | "SONDAGE";
  titre: string;
  description: string;
  resumeVulgarise: string;
  dateOuverture: string;
  dateCloture: string;
  resultatsPublies: boolean;
  options: { id: string; libelle: string }[];
}

export interface SignalementAdmin {
  id: string;
  message: string;
  statut: "EN_ATTENTE" | "TRAITE";
  creeLe: string;
}

/** Tous les débats — le tri par statut se fait à l'affichage. */
export function listDebats(): Promise<DebatAdmin[]> {
  return apiFetch<DebatAdmin[]>("/debats");
}

/** Détail d'un débat (public côté API, mais la console reste sous garde). */
export function getDebatAdmin(id: string): Promise<DebatAdmin> {
  return apiFetch<DebatAdmin>(`/debats/${id}`);
}

/** File des signalements du live — l'état initial de la console. */
export function listSignalements(debatId: string): Promise<SignalementAdmin[]> {
  return apiFetch<SignalementAdmin[]>(`/debats/${debatId}/signalements`);
}

export function listConsultationsAdmin(): Promise<ConsultationAdmin[]> {
  return apiFetch<ConsultationAdmin[]>("/consultations", {
    parametres: { statut: "toutes" },
  });
}

/** Le dépouillement d'une consultation clôturée, tel que servi au staff. */
export interface Depouillement {
  options: { optionId: string; libelle: string; nombreVotes: number }[];
  totalVoix: number;
  /** Citoyens émargés — jamais reliés aux bulletins (secret du vote). */
  emargements: number;
}

/**
 * Comptes de l'urne, disponibles dès la clôture et AVANT publication :
 * l'admin voit ce qu'il s'apprête à publier. Le serveur refuse tant que le
 * vote est ouvert — aucun résultat intermédiaire n'existe.
 */
export function getDepouillement(id: string): Promise<Depouillement> {
  return apiFetch<Depouillement>(`/consultations/${id}/depouillement`);
}

/** Une consultation est ouverte si l'instant présent est dans sa fenêtre. */
export function estOuverte(consultation: ConsultationAdmin): boolean {
  const maintenant = Date.now();
  return (
    new Date(consultation.dateOuverture).getTime() <= maintenant &&
    maintenant < new Date(consultation.dateCloture).getTime()
  );
}

/** Résultats agrégés — uniquement après publication par un admin. */
export function resultatsConsultation(
  id: string,
): Promise<{ optionId: string; libelle: string; nombreVotes: number }[]> {
  return apiFetch(`/consultations/${id}/resultats`);
}

/** Résumés IA en attente — le bandeau renvoie vers la modération. */
export async function compterResumesEnAttente(): Promise<number> {
  try {
    const resumes = await apiFetch<unknown[]>("/debats/resumes/liste", {
      parametres: { statut: "EN_ATTENTE_VALIDATION" },
    });
    return resumes.length;
  } catch {
    return 0;
  }
}
