import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../stores/authStore';
import { API_BASE_URL, API_TIMEOUT } from '../../constants/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

/** Attache le jeton d'accès courant à chaque requête sortante. */
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Rafraîchissement du jeton sur 401 ───────────────────────────────
//
// L'accès expire en 15 min. Sur un 401, on tente un renouvellement via
// /auth/refresh, puis on rejoue la requête. Pendant ce renouvellement,
// toutes les autres requêtes qui échouent en 401 attendent le même résultat :
// sans cette file, dix appels simultanés déclencheraient dix refresh.

let isRefreshing = false;
let pendingQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

const flushQueue = (error: unknown, token: string | null) => {
  pendingQueue.forEach((entry) => {
    if (token) entry.resolve(token);
    else entry.reject(error);
  });
  pendingQueue = [];
};

/** Client dédié au refresh : sans intercepteur, pour éviter toute récursion. */
async function requestNewTokens(refreshToken: string) {
  const response = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
    { timeout: API_TIMEOUT, headers: { 'Content-Type': 'application/json' } }
  );
  return response.data as { accessToken: string; refreshToken: string };
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const { refreshToken, setTokens, clearSession } = useAuthStore.getState();

    // Ni un 401, ni une session refreshable, ni une requête rejouable : on
    // laisse remonter l'erreur telle quelle.
    const isRefreshCall = original?.url?.includes('/auth/refresh');
    if (status !== 401 || !refreshToken || !original || original._retry || isRefreshCall) {
      if (status === 401 && !refreshToken) {
        // Pas de jeton de secours : la session est bel et bien terminée.
        await clearSession();
      }
      return Promise.reject(error);
    }

    original._retry = true;

    // Un rafraîchissement est déjà en cours : se mettre en file.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const tokens = await requestNewTokens(refreshToken);
      await setTokens(tokens.accessToken, tokens.refreshToken);
      flushQueue(null, tokens.accessToken);
      original.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return apiClient(original);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      // Le rafraîchissement a échoué : la session est irrécupérable.
      await clearSession();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─── Normalisation des erreurs ───────────────────────────────────────
export interface ApiError {
  statusCode: number;
  message: string;
  path?: string;
}

/**
 * Extrait un message lisible d'une erreur axios, en s'appuyant sur le format
 * uniforme du backend `{ statusCode, message, path, timestamp }`.
 */
export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { statusCode?: number; message?: string | string[]; path?: string }
      | undefined;

    const rawMessage = data?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(' ')
      : (rawMessage ??
        (error.code === 'ECONNABORTED'
          ? 'Le serveur met trop de temps à répondre.'
          : error.message === 'Network Error'
            ? 'Impossible de joindre le serveur. Vérifiez votre connexion.'
            : 'Une erreur est survenue.'));

    return {
      statusCode: data?.statusCode ?? error.response?.status ?? 0,
      message,
      path: data?.path,
    };
  }

  return { statusCode: 0, message: 'Une erreur inattendue est survenue.' };
}
