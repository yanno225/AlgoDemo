import { apiClient } from './client';
import { mediaUrl } from '../../constants/api';
import { THEMATICS, type ThematicId } from '../../constants/thematics';

/**
 * Service du feed immersif.
 *
 * Le backend parle français (titre, corps, thematique…) et identifie les
 * thématiques par UUID ; l'app par slugs (`droit`, `genre_societe`…). La
 * correspondance se fait par libellé — normalisé, pour survivre à une
 * retouche typographique côté back-office.
 */

// ─── Correspondance thématiques (slug ↔ backend) ─────────────────────

const normaliser = (texte: string) =>
  texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

const SLUG_PAR_LIBELLE = new Map<string, ThematicId>(
  THEMATICS.map((thematic) => [normaliser(thematic.label), thematic.id])
);

/** UUID backend de chaque slug — rempli au premier appel, puis en cache. */
let uuidParSlug: Map<ThematicId, string> | null = null;

async function resoudreUuid(slug: ThematicId): Promise<string | undefined> {
  if (!uuidParSlug) {
    const { data } = await apiClient.get<{ id: string; libelle: string }[]>(
      '/thematiques'
    );
    uuidParSlug = new Map();
    for (const thematique of data) {
      const correspondance = SLUG_PAR_LIBELLE.get(normaliser(thematique.libelle));
      if (correspondance) uuidParSlug.set(correspondance, thematique.id);
    }
  }
  return uuidParSlug.get(slug);
}

// ─── Modèle ──────────────────────────────────────────────────────────

interface BackendContenu {
  id: string;
  titre: string;
  corps: string;
  type: 'ARTICLE' | 'FICHE' | 'VIDEO';
  statutVerification: 'NON_VERIFIE' | 'PARTIELLEMENT_VERIFIE' | 'VERIFIE';
  estOfficiel: boolean;
  source: string | null;
  urlMedia: string | null;
  urlAudio: string | null;
  publieLe: string | null;
  creeLe: string;
  thematique: { id: string; libelle: string } | null;
  nombreReactions?: number;
  nombreCommentaires?: number;
}

interface PageBackend {
  data: BackendContenu[];
  total: number;
  page: number;
  limite: number;
}

export interface FeedPage {
  items: import('../../components/feature/feed/ImmersiveCard').FeedItem[];
  total: number;
  page: number;
  /** Vrai s'il reste des pages à charger après celle-ci. */
  suivante: boolean;
}

export interface Commentaire {
  id: string;
  texte: string;
  /** « Prénom N. » — ou « Citoyen » pour un compte anonymisé. */
  auteur: string;
  /** Commentaire racine auquel celui-ci répond (fil à un niveau). */
  parentId: string | null;
  /** Nombre de « j'aime » sur ce commentaire. */
  nbAimes: number;
  creeLe: string;
}

const NIVEAU_VERIFICATION: Record<
  BackendContenu['statutVerification'],
  1 | 2 | 3
> = {
  NON_VERIFIE: 1,
  PARTIELLEMENT_VERIFIE: 2,
  VERIFIE: 3,
};

/** Résumé lisible : les premières phrases du corps, coupées à ~180 caractères. */
function resumer(corps: string): string {
  if (corps.length <= 180) return corps;
  const tronque = corps.slice(0, 180);
  const finPhrase = tronque.lastIndexOf('. ');
  return finPhrase > 60 ? tronque.slice(0, finPhrase + 1) : `${tronque.trimEnd()}…`;
}

function formaterDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function mapContenu(
  backend: BackendContenu
): import('../../components/feature/feed/ImmersiveCard').FeedItem {
  const slug = backend.thematique
    ? SLUG_PAR_LIBELLE.get(normaliser(backend.thematique.libelle))
    : undefined;
  const estVideo = backend.type === 'VIDEO' && Boolean(backend.urlMedia);
  return {
    id: backend.id,
    title: backend.titre,
    summary: resumer(backend.corps),
    body: backend.corps,
    thematicId: slug ?? 'politique',
    source: backend.source ?? 'AlgoDémo',
    verificationLevel: NIVEAU_VERIFICATION[backend.statutVerification],
    isOfficial: backend.estOfficiel,
    date: formaterDate(backend.publieLe ?? backend.creeLe),
    // `urlMedia` porte l'image OU la vidéo — le `type` du contenu tranche.
    imageUrl: estVideo ? undefined : mediaUrl(backend.urlMedia) ?? undefined,
    videoUrl: estVideo ? mediaUrl(backend.urlMedia)! : undefined,
    likesCount: backend.nombreReactions ?? 0,
    commentsCount: backend.nombreCommentaires ?? 0,
  };
}

// ─── Lecture ─────────────────────────────────────────────────────────

export async function listFeed(options: {
  page?: number;
  limite?: number;
  q?: string;
  /** Filtre serveur — un seul slug (l'API n'en accepte qu'un). */
  thematic?: ThematicId;
} = {}): Promise<FeedPage> {
  const thematiqueId = options.thematic
    ? await resoudreUuid(options.thematic)
    : undefined;

  const { data } = await apiClient.get<PageBackend>('/feed', {
    params: {
      page: options.page ?? 1,
      limite: options.limite ?? 20,
      ...(options.q ? { q: options.q } : {}),
      ...(thematiqueId ? { thematiqueId } : {}),
    },
  });

  return {
    items: data.data.map(mapContenu),
    total: data.total,
    page: data.page,
    suivante: data.page * data.limite < data.total,
  };
}

// ─── Interactions ────────────────────────────────────────────────────

/** Bascule « j'aime » — un second appel retire la réaction. */
export async function toggleLike(
  contenuId: string
): Promise<{ aime: boolean; total: number }> {
  const { data } = await apiClient.post<{ aime: boolean; total: number }>(
    `/feed/${contenuId}/aimer`
  );
  return data;
}

/** Contenus déjà aimés — pour peindre les cœurs au chargement. */
export async function listMyLikes(): Promise<Set<string>> {
  const { data } = await apiClient.get<string[]>('/feed/reactions/miennes');
  return new Set(data);
}

export async function listComments(contenuId: string): Promise<Commentaire[]> {
  const { data } = await apiClient.get<Commentaire[]>(
    `/feed/${contenuId}/commentaires`
  );
  return data;
}

export async function postComment(
  contenuId: string,
  texte: string,
  parentId?: string
): Promise<Commentaire> {
  const { data } = await apiClient.post<Commentaire>(
    `/feed/${contenuId}/commentaires`,
    { texte, ...(parentId ? { parentId } : {}) }
  );
  return data;
}

/** Bascule « j'aime » sur un commentaire — le serveur renvoie l'état exact. */
export async function toggleCommentLike(
  commentaireId: string
): Promise<{ aime: boolean; total: number }> {
  const { data } = await apiClient.post<{ aime: boolean; total: number }>(
    `/feed/commentaires/${commentaireId}/aimer`
  );
  return data;
}

/** Commentaires de CE contenu que j'ai aimés — peint les cœurs à l'ouverture. */
export async function listMyCommentLikes(
  contenuId: string
): Promise<Set<string>> {
  const { data } = await apiClient.get<string[]>(
    `/feed/${contenuId}/commentaires/reactions-miennes`
  );
  return new Set(data);
}

/** Marquer lu (historique §6.1) — silencieux : un échec ne gêne pas la lecture. */
export async function markAsRead(contenuId: string): Promise<void> {
  try {
    await apiClient.post(`/feed/${contenuId}/lu`);
  } catch {
    // L'historique est un confort, jamais un blocage.
  }
}

export async function reportContent(
  contenuId: string,
  motif: string
): Promise<void> {
  await apiClient.post(`/feed/${contenuId}/signaler`, { motif });
}
