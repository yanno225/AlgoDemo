import { apiClient } from './client';
import type { User } from '../../stores/authStore';

/**
 * Service d'authentification.
 *
 * Fait le pont entre le contrat du backend (`nom`, `prenom`, rôles en
 * majuscules) et le modèle `User` de l'application (`firstName`, `lastName`,
 * rôles en minuscules). Ce mapping vit ici, à la frontière : aucun écran n'a
 * à connaître la forme exacte de l'API.
 */

// ─── Formes renvoyées par le backend ─────────────────────────────────
type BackendRole = 'UTILISATEUR' | 'POINT_FOCAL' | 'ADMIN';

interface BackendUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  role: BackendRole;
  emailVerifie: boolean;
  compteValide: boolean;
  estBloque: boolean;
  deuxFaActif: boolean;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Réponse de login : jetons, ou demande de second facteur. */
type LoginResponse = TokenPair | { deuxFaRequis: true };

const ROLE_MAP: Record<BackendRole, User['role']> = {
  UTILISATEUR: 'standard',
  POINT_FOCAL: 'point_focal',
  ADMIN: 'admin_labo',
};

/** Traduit un utilisateur du backend vers le modèle de l'application. */
export function mapUser(backend: BackendUser): User {
  return {
    id: backend.id,
    firstName: backend.prenom,
    lastName: backend.nom,
    // Le backend ne porte pas d'âge : champ conservé pour l'UI, non renseigné.
    age: 0,
    email: backend.email,
    phone: backend.telephone ?? undefined,
    role: ROLE_MAP[backend.role],
    isActive: backend.compteValide && !backend.estBloque,
  };
}

// ─── Requêtes ────────────────────────────────────────────────────────
export interface RegisterInput {
  email: string;
  motDePasse: string;
  nom: string;
  prenom: string;
  telephone?: string;
}

/** Inscription — un code de vérification est envoyé (journalisé en dev). */
export async function register(input: RegisterInput): Promise<void> {
  await apiClient.post('/auth/register', input);
}

/** Vérifie l'email avec le code à 6 chiffres reçu. */
export async function verifyEmail(email: string, code: string): Promise<void> {
  await apiClient.post('/auth/verify-email', { email, code });
}

/** Redemande l'envoi d'un code de vérification. */
export async function resendOtp(email: string): Promise<void> {
  await apiClient.post('/auth/resend-otp', { email });
}

/**
 * Connexion. Renvoie soit la paire de jetons, soit une demande de 2FA quand
 * le compte a activé le second facteur.
 */
export async function login(
  email: string,
  motDePasse: string,
  codeOtp?: string
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', {
    email,
    motDePasse,
    ...(codeOtp ? { codeOtp } : {}),
  });
  return data;
}

/** Récupère le profil courant, déjà traduit au modèle de l'application. */
export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<BackendUser>('/auth/me');
  return mapUser(data);
}

/** Révoque le refresh token côté serveur. */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // Une déconnexion ne doit jamais échouer côté client : même si le serveur
    // est injoignable, la session locale sera purgée par l'appelant.
  }
}

/** Discrimine la réponse de login sans exposer sa forme aux écrans. */
export function isTokenPair(response: LoginResponse): response is TokenPair {
  return 'accessToken' in response;
}

// ─── Relais d'inscription (mémoire vive uniquement) ──────────────────
//
// Après vérification de l'email, il faut le mot de passe pour obtenir les
// jetons. On le garde ici, en mémoire, le temps de passer de l'écran
// d'inscription à celui du code : jamais dans les paramètres de navigation
// (journalisables) ni dans le stockage persistant. Consommé une seule fois.

let pendingCredentials: { email: string; password: string } | null = null;

export function rememberPendingLogin(email: string, password: string): void {
  pendingCredentials = { email, password };
}

export function consumePendingLogin(): { email: string; password: string } | null {
  const value = pendingCredentials;
  pendingCredentials = null;
  return value;
}
