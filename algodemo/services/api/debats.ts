import { apiClient } from './client';

/**
 * Service des débats.
 *
 * Le backend porte déjà le statut (`PLANIFIE` / `EN_COURS` / `TERMINE`) et la
 * thématique : le mapping se limite à traduire les noms de champs vers le
 * modèle d'affichage.
 */

export type DebateStatus = 'upcoming' | 'live' | 'ended';
export type DebateFilter = 'a-venir' | 'en-cours' | 'termines';

interface BackendDebate {
  id: string;
  titre: string;
  description: string;
  statut: 'PLANIFIE' | 'EN_COURS' | 'TERMINE';
  dateDebut: string;
  urlReplay: string | null;
  moderateurId: string | null;
  thematique: { id: string; libelle: string } | null;
  creeLe: string;
}

export interface Debate {
  id: string;
  title: string;
  description: string;
  status: DebateStatus;
  startsAt: string;
  thematicLabel: string | null;
  replayUrl: string | null;
}

const STATUS_MAP: Record<BackendDebate['statut'], DebateStatus> = {
  PLANIFIE: 'upcoming',
  EN_COURS: 'live',
  TERMINE: 'ended',
};

function mapDebate(backend: BackendDebate): Debate {
  return {
    id: backend.id,
    title: backend.titre,
    description: backend.description,
    status: STATUS_MAP[backend.statut],
    startsAt: backend.dateDebut,
    thematicLabel: backend.thematique?.libelle ?? null,
    replayUrl: backend.urlReplay,
  };
}

/** Liste des débats, filtrée par état. Sans filtre : tous. */
export async function listDebates(filter?: DebateFilter): Promise<Debate[]> {
  const { data } = await apiClient.get<BackendDebate[]>('/debats', {
    params: filter ? { filtre: filter } : undefined,
  });
  return data.map(mapDebate);
}
