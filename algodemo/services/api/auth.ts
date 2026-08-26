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
  consentementNotifications?: boolean;
  creeLe?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Réponse de login : jetons, demande de code TOTP (2FA activée), ou demande
 * du code de connexion envoyé par email (§9.3 — à chaque connexion).
 */
type LoginResponse =
  | TokenPair
  | { deuxFaRequis: true }
  | { otpRequis: true };

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
    createdAt: backend.creeLe,
    twoFaEnabled: backend.deuxFaActif,
    notifConsent: backend.consentementNotifications,
  };
}

// ─── Sécurité du compte (2FA TOTP) ───────────────────────────────────

/** Démarre l'activation : secret à saisir dans l'app d'authentification. */
export async function enable2Fa(): Promise<{ secret: string; otpauthUrl: string }> {
  const { data } = await apiClient.post<{ secret: string; otpauthUrl: string }>(
    '/auth/2fa/enable'
  );
  return data;
}

/** Active définitivement la 2FA avec un premier code TOTP valide. */
export async function confirm2Fa(code: string): Promise<void> {
  await apiClient.post('/auth/2fa/confirm', { code });
}

/** Désactive la 2FA — exige un code TOTP valide. */
export async function disable2Fa(code: string): Promise<void> {
  await apiClient.post('/auth/2fa/disable', { code });
}

// ─── RGPD : consentement et anonymisation ────────────────────────────

export async function updateConsent(consent: {
  consentementNotifications?: boolean;
  politiqueConfidentialiteAcceptee?: boolean;
}): Promise<User> {
  const { data } = await apiClient.patch<BackendUser>('/auth/consent', consent);
  return mapUser(data);
}

/**
 * Anonymisation irréversible (RG-USR-07) : le compte est anonymisé, toutes
 * les contributions passées s'affichent « Citoyen », les sessions sont
 * révoquées côté serveur.
 */
export async function anonymiser(): Promise<void> {
  await apiClient.post('/auth/anonymisation');
}

// ─── Mes statistiques d'activité (compteurs réels du backend) ────────
export interface MyStats {
  avisDeposes: number;
  avisApprouves: number;
  votesConsultations: number;
  votesDebats: number;
  debatsRejoints: number;
  prisesDeParole: number;
  signalementsEmis: number;
}

/** Les compteurs affichés par le profil — comptés côté serveur, rien d'estimé. */
export async function getMyStats(): Promise<MyStats> {
  const { data } = await apiClient.get<MyStats>('/auth/users/moi/statistiques');
  return data;
}

/** Une ligne de l'historique d'activité (paramètres → Historique). */
export interface HistoryEntry {
  type:
    | 'AVIS'
    | 'VOTE_CONSULTATION'
    | 'DEBAT_REJOINT'
    | 'VOTE_DEBAT'
    | 'MESSAGE_DEBAT'
    | 'COMMENTAIRE'
    | 'SIGNALEMENT_TERRAIN'
    | 'SIGNALEMENT_CONTENU'
    | 'PRISE_PAROLE';
  libelle: string;
  date: string;
}

/** Les 100 derniers événements du compte — jamais les choix de vote. */
export async function getMyHistory(): Promise<HistoryEntry[]> {
  const { data } = await apiClient.get<HistoryEntry[]>('/auth/users/moi/historique');
  return data;
}

/** Export complet des données du compte (portabilité RGPD, art. 20). */
export async function getMyDataExport(): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get<Record<string, unknown>>('/auth/users/moi/donnees');
  return data;
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

/** Le serveur attend le code de connexion envoyé par email. */
export function isOtpRequired(
  response: LoginResponse
): response is { otpRequis: true } {
  return 'otpRequis' in response;
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

/**
 * Lecture SANS consommation — parcours OTP de connexion : un code erroné
 * autorise une nouvelle tentative, les identifiants doivent donc survivre
 * jusqu'au succès (où `consumePendingLogin` les efface).
 */
export function peekPendingLogin(): { email: string; password: string } | null {
  return pendingCredentials;
}
