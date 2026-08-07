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

interface BackendOption {
  id: string;
  libelle: string;
}

interface BackendConsultation {
  id: string;
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

/** Liste des consultations, filtrée par état. Sans filtre : toutes. */
export async function listConsultations(
  filter: ConsultationFilter = 'toutes'
): Promise<Consultation[]> {
  const { data } = await apiClient.get<BackendConsultation[]>('/consultations', {
    params: { statut: filter },
  });
  return data.map(mapConsultation);
}
