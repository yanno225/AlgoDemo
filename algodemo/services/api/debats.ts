import { apiClient } from './client';
import { mediaUrl } from '../../constants/api';
import { THEMATICS, type ThematicId } from '../../constants/thematics';

/**
 * Service des débats.
 *
 * Le backend porte déjà le statut (`PLANIFIE` / `EN_COURS` / `TERMINE`) et la
 * thématique : le mapping se limite à traduire les noms de champs vers le
 * modèle d'affichage.
 *
 * Plusieurs débats peuvent être EN_COURS au même moment — c'est un cas
 * nominal, l'écran les affiche tous et l'image de couverture (`coverUrl`,
 * choisie par l'admin) est ce qui les distingue visuellement.
 */

export type DebateStatus = 'upcoming' | 'live' | 'ended';
export type DebateFilter = 'a-venir' | 'en-cours' | 'termines';

interface BackendAffirmation {
  id: string;
  texte: string;
  statut: 'OUVERTE' | 'FERMEE';
  creeLe: string;
}

interface BackendDebate {
  id: string;
  titre: string;
  description: string | null;
  statut: 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
  dateDebut: string;
  urlReplay: string | null;
  urlCouverture: string | null;
  moderateurId: string | null;
  thematique: { id: string; libelle: string } | null;
  affirmations?: BackendAffirmation[];
  creeLe: string;
}

export interface Debate {
  id: string;
  title: string;
  description: string;
  status: DebateStatus;
  startsAt: string;
  thematicLabel: string | null;
  /** Slug local (couleurs, dégradés de repli) résolu depuis le libellé. */
  thematicId: ThematicId | null;
  coverUrl: string | null;
  replayUrl: string | null;
}

/** Affirmation soumise au vote de la salle pendant le direct. */
export interface DebateAffirmation {
  id: string;
  text: string;
  isOpen: boolean;
}

export interface DebateDetail extends Debate {
  affirmations: DebateAffirmation[];
}

const STATUS_MAP: Record<BackendDebate['statut'], DebateStatus> = {
  PLANIFIE: 'upcoming',
  EN_COURS: 'live',
  TERMINE: 'ended',
  // Un débat annulé est filtré des listes ; s'il est ouvert par un lien
  // direct, il se comporte comme un direct terminé (écran de sortie propre).
  ANNULE: 'ended',
};

// Le backend identifie les thématiques par libellé libre ; l'app par slug de
// la charte. Correspondance par libellé normalisé, comme dans le feed.
const normaliser = (texte: string) =>
  texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

const SLUG_PAR_LIBELLE = new Map<string, ThematicId>(
  THEMATICS.map((thematic) => [normaliser(thematic.label), thematic.id])
);

function mapDebate(backend: BackendDebate): Debate {
  return {
    id: backend.id,
    title: backend.titre,
    description: backend.description ?? '',
    status: STATUS_MAP[backend.statut],
    startsAt: backend.dateDebut,
    thematicLabel: backend.thematique?.libelle ?? null,
    thematicId: backend.thematique
      ? (SLUG_PAR_LIBELLE.get(normaliser(backend.thematique.libelle)) ?? null)
      : null,
    coverUrl: mediaUrl(backend.urlCouverture),
    replayUrl: mediaUrl(backend.urlReplay),
  };
}

/** Liste des débats, filtrée par état. Sans filtre : tous. */
export async function listDebates(filter?: DebateFilter): Promise<Debate[]> {
  const { data } = await apiClient.get<BackendDebate[]>('/debats', {
    params: filter ? { filtre: filter } : undefined,
  });
  // Un débat annulé n'a plus sa place sur les écrans citoyens.
  return data.filter((debat) => debat.statut !== 'ANNULE').map(mapDebate);
}

/** Détail d'un débat, affirmations comprises (GET /debats/:id, public). */
export async function getDebate(id: string): Promise<DebateDetail> {
  const { data } = await apiClient.get<BackendDebate>(`/debats/${id}`);
  return {
    ...mapDebate(data),
    affirmations: (data.affirmations ?? []).map((affirmation) => ({
      id: affirmation.id,
      text: affirmation.texte,
      isOpen: affirmation.statut === 'OUVERTE',
    })),
  };
}
