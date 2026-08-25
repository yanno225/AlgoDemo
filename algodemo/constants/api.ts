import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Adresse du backend AlgoDémo.
 *
 * Le bon hôte dépend de l'endroit où tourne l'application :
 *
 * - **Téléphone réel via Expo Go** (cas d'une démonstration) : l'IP du PC sur
 *   le Wi-Fi. Expo la connaît déjà — c'est l'hôte depuis lequel le bundle a
 *   été servi — donc on la déduit automatiquement ci-dessous.
 * - **Émulateur Android** : `10.0.2.2` est l'alias qui pointe vers le PC hôte.
 * - **Simulateur iOS** : `localhost` suffit.
 *
 * Pour forcer une adresse (backend sur une autre machine, tunnel…), définir
 * `EXPO_PUBLIC_API_URL` dans un fichier `.env` — elle a toujours la priorité.
 */

const API_PORT = 3000;

/** IP du poste qui sert le bundle Expo, extraite de l'URL de développement. */
function hostFromExpo(): string | null {
  // `hostUri` ressemble à « 192.168.1.20:8081 » en réseau local.
  const hostUri =
    Constants.expoConfig?.hostUri ??
    // Chemins de repli selon la version d'Expo.
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost ??
    (Constants.manifest2 as { extra?: { expoGo?: { debuggerHost?: string } } } | undefined)
      ?.extra?.expoGo?.debuggerHost;

  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  // Une IP LAN est exploitable telle quelle ; « localhost » ne l'est pas
  // depuis un téléphone, on laissera la logique par plateforme trancher.
  return host && host !== 'localhost' && host !== '127.0.0.1' ? host : null;
}

function resolveBaseUrl(): string {
  // 1. Surcharge explicite — priorité absolue.
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) return override.replace(/\/$/, '');

  // 2. Téléphone réel : réutiliser l'IP qui sert déjà le bundle.
  const expoHost = hostFromExpo();
  if (expoHost) return `http://${expoHost}:${API_PORT}`;

  // 3. Repli par plateforme (émulateur / simulateur).
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:${API_PORT}`;
}

export const API_BASE_URL = resolveBaseUrl();

/**
 * Rend absolue une URL média renvoyée par l'API. Le backend stocke des
 * chemins RELATIFS (`/media/f/…`) et streame lui-même les fichiers : en les
 * préfixant ici par l'adresse courante de l'API, les médias fonctionnent sur
 * n'importe quel réseau (maison, salle de démo…) sans IP figée en base.
 */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
}

/** Délai maximal d'une requête, en millisecondes. */
export const API_TIMEOUT = 15000;
