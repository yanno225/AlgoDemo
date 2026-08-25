import { apiClient } from './client';
import { mediaUrl } from '../../constants/api';

/**
 * Signalements citoyens de terrain — module backend `participation`.
 *
 * Les catégories transitent en slugs backend (VOIRIE…) mais l'app raisonne
 * avec ses clés i18n (`road`, `lighting`…) : la correspondance vit ici, en un
 * seul endroit. La photo part d'abord vers MinIO (POST /media/upload), le
 * signalement ne porte que son URL.
 */

export type ReportCategoryKey =
  | 'road'
  | 'lighting'
  | 'waste'
  | 'water'
  | 'safety'
  | 'misinformation'
  | 'other';

export type ReportStatus = 'RECU' | 'EN_COURS' | 'RESOLU' | 'REJETE';

type BackendCategorie =
  | 'VOIRIE'
  | 'ECLAIRAGE'
  | 'DECHETS'
  | 'EAU'
  | 'SECURITE'
  | 'DESINFORMATION'
  | 'AUTRE';

const CATEGORIE_PAR_CLE: Record<ReportCategoryKey, BackendCategorie> = {
  road: 'VOIRIE',
  lighting: 'ECLAIRAGE',
  waste: 'DECHETS',
  water: 'EAU',
  safety: 'SECURITE',
  misinformation: 'DESINFORMATION',
  other: 'AUTRE',
};

const CLE_PAR_CATEGORIE = Object.fromEntries(
  Object.entries(CATEGORIE_PAR_CLE).map(([cle, categorie]) => [categorie, cle])
) as Record<BackendCategorie, ReportCategoryKey>;

interface BackendSignalement {
  id: string;
  categorie: BackendCategorie;
  description: string;
  adresse: string;
  urlPhoto: string | null;
  statut: ReportStatus;
  creeLe: string;
}

export interface CitizenReport {
  id: string;
  categoryKey: ReportCategoryKey;
  description: string;
  address: string;
  photoUrl: string | null;
  status: ReportStatus;
  createdAt: string;
}

function mapReport(backend: BackendSignalement): CitizenReport {
  return {
    id: backend.id,
    categoryKey: CLE_PAR_CATEGORIE[backend.categorie] ?? 'other',
    description: backend.description,
    address: backend.adresse,
    photoUrl: mediaUrl(backend.urlPhoto),
    status: backend.statut,
    createdAt: backend.creeLe,
  };
}

/** Fil public des signalements récents — anonyme côté serveur. */
export async function listRecentReports(): Promise<CitizenReport[]> {
  const { data } = await apiClient.get<BackendSignalement[]>(
    '/participation/signalements/recents'
  );
  return data.map(mapReport);
}

/** Mes signalements, avec leur statut de traitement. */
export async function listMyReports(): Promise<CitizenReport[]> {
  const { data } = await apiClient.get<BackendSignalement[]>(
    '/participation/signalements/miens'
  );
  return data.map(mapReport);
}

/** Envoie la photo du constat vers MinIO et renvoie son URL publique. */
async function uploadPhoto(photoUri: string): Promise<string> {
  const extension = photoUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const form = new FormData();
  // Format de fichier React Native : { uri, name, type }.
  form.append('fichier', {
    uri: photoUri,
    name: `signalement.${extension}`,
    type: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
  } as unknown as Blob);

  const { data } = await apiClient.post<{ url: string }>('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}

export interface ReportDraft {
  categoryKey: ReportCategoryKey;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  photoUri: string | null;
}

/** Dépose un signalement (photo uploadée d'abord, si présente). */
export async function createReport(draft: ReportDraft): Promise<CitizenReport> {
  const urlPhoto = draft.photoUri ? await uploadPhoto(draft.photoUri) : undefined;

  const { data } = await apiClient.post<BackendSignalement>(
    '/participation/signalements',
    {
      categorie: CATEGORIE_PAR_CLE[draft.categoryKey],
      description: draft.description,
      adresse: draft.address,
      ...(draft.latitude !== undefined ? { latitude: draft.latitude } : {}),
      ...(draft.longitude !== undefined ? { longitude: draft.longitude } : {}),
      ...(urlPhoto ? { urlPhoto } : {}),
    }
  );
  return mapReport(data);
}
