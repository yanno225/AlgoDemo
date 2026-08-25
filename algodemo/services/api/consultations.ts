import { apiClient } from './client';

/**
 * Service des consultations.
 *
 * Le backend renvoie les dates d'ouverture et de clôture ; l'état (à venir,
 * ouverte, clôturée) et le nombre de jours restants en sont dérivés ici, une
 * seule fois, pour que les écrans n'aient qu'à afficher.
 */

export type ConsultationStatus = 'upcoming' | 'open' | 'closed';
export type ConsultationFilter = 'ouvertes' | 'cloturees' | 'toutes';
/** SONDAGE = question rapide (onglet dédié) — même moteur, même vote secret. */
export type ConsultationType = 'CONSULTATION' | 'SONDAGE';

interface BackendOption {
  id: string;
  libelle: string;
}

interface BackendConsultation {
  id: string;
  type: ConsultationType;
  titre: string;
  description: string;
  resumeVulgarise: string;
  dateOuverture: string;
  dateCloture: string;
  resultatsPublies: boolean;
  options: BackendOption[];
}

export interface ConsultationOption {
  id: string;
  label: string;
}

export interface Consultation {
  id: string;
  type: ConsultationType;
  title: string;
  description: string;
  plainSummary: string;
  opensAt: string;
  closesAt: string;
  status: ConsultationStatus;
  /** Jours avant la clôture ; négatif si déjà clôturée. */
  daysLeft: number;
  resultsPublished: boolean;
  options: ConsultationOption[];
}

const DAY_MS = 86_400_000;

function deriveStatus(opensAt: string, closesAt: string): ConsultationStatus {
  const now = Date.now();
  if (now < new Date(opensAt).getTime()) return 'upcoming';
  if (now > new Date(closesAt).getTime()) return 'closed';
  return 'open';
}

function mapConsultation(backend: BackendConsultation): Consultation {
  const daysLeft = Math.ceil(
    (new Date(backend.dateCloture).getTime() - Date.now()) / DAY_MS
  );

  return {
    id: backend.id,
    type: backend.type,
    title: backend.titre,
    description: backend.description,
    plainSummary: backend.resumeVulgarise,
    opensAt: backend.dateOuverture,
    closesAt: backend.dateCloture,
    status: deriveStatus(backend.dateOuverture, backend.dateCloture),
    daysLeft,
    resultsPublished: backend.resultatsPublies,
    options: backend.options.map((option) => ({
      id: option.id,
      label: option.libelle,
    })),
  };
}

/** Liste des consultations, filtrée par état et par type. */
export async function listConsultations(
  filter: ConsultationFilter = 'toutes',
  type?: ConsultationType
): Promise<Consultation[]> {
  const { data } = await apiClient.get<BackendConsultation[]>('/consultations', {
    params: { statut: filter, ...(type ? { type } : {}) },
  });
  return data.map(mapConsultation);
}

/**
 * Dépose un bulletin — vote unique et SECRET (émargement et urne séparés côté
 * serveur) : la réponse ne renvoie jamais le choix déposé.
 */
export async function voteConsultation(
  consultationId: string,
  optionId: string
): Promise<void> {
  await apiClient.post(`/consultations/${consultationId}/vote`, { optionId });
}

/** Ai-je déjà émargé ? (le serveur ne dit jamais POUR QUOI on a voté) */
export async function hasVoted(consultationId: string): Promise<boolean> {
  const { data } = await apiClient.get<{ aVote: boolean }>(
    `/consultations/${consultationId}/a-vote`
  );
  return data.aVote;
}

export interface ConsultationResult {
  optionId: string;
  label: string;
  votes: number;
}

/** Résultats agrégés — disponibles seulement après publication par un admin. */
export async function getResults(
  consultationId: string
): Promise<ConsultationResult[]> {
  const { data } = await apiClient.get<
    { optionId: string; libelle: string; nombreVotes: number }[]
  >(`/consultations/${consultationId}/resultats`);
  return data.map((ligne) => ({
    optionId: ligne.optionId,
    label: ligne.libelle,
    votes: ligne.nombreVotes,
  }));
}
