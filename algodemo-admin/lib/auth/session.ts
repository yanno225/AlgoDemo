import { cookies } from "next/headers";
import type { AdminUser } from "@/lib/domain/types";
import { ROLES, type UserRole } from "@/lib/domain/roles";

export const SESSION_COOKIE = "algodemo_admin_session";

/**
 * Étapes du parcours d'accès.
 *
 * Le jeton n'est pleinement valide qu'en `active` : franchir la 2FA sans
 * accepter le protocole de responsabilité (RG-USR-07) ne donne aucun droit.
 */
export type SessionStage = "credentials" | "verified" | "active";

export interface Session {
  email: string;
  stage: SessionStage;
  /** Jetons délivrés par l'API NestJS (POST /auth/login). */
  accessToken?: string;
  refreshToken?: string;
  /** Le compte est-il réellement protégé par un second facteur (TOTP) ? */
  deuxFa?: boolean;
}

/** Rôles tels que sérialisés par le backend (enum Role côté NestJS). */
export type RoleBackend = "UTILISATEUR" | "POINT_FOCAL" | "ADMIN";

/**
 * Correspondance des rôles backend → rôles du front.
 *
 * Les deux vocabulaires diffèrent historiquement ; cette table est le seul
 * endroit où la traduction a lieu.
 */
const ROLES_BACKEND: Record<RoleBackend, UserRole> = {
  UTILISATEUR: ROLES.STANDARD,
  POINT_FOCAL: ROLES.POINT_FOCAL,
  ADMIN: ROLES.ADMIN_LABO,
};

/** Profil renvoyé par GET /auth/me (noms de champs français). */
export interface ProfilBackend {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: RoleBackend;
  compteValide?: boolean;
  creeLe?: string;
  /** Vrai si un second facteur TOTP est activé sur le compte. */
  deuxFaActif?: boolean;
}

export const mapProfil = (profil: ProfilBackend): AdminUser => ({
  id: profil.id,
  firstName: profil.prenom,
  lastName: profil.nom,
  email: profil.email,
  role: ROLES_BACKEND[profil.role] ?? ROLES.STANDARD,
  isActive: profil.compteValide ?? true,
  createdAt: profil.creeLe ?? new Date(0).toISOString(),
});

/** Lit le cookie de session. `null` si absent ou illisible. */
export async function readSession(): Promise<Session | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Session;
    return parsed.email ? parsed : null;
  } catch {
    // Cookie corrompu ou forgé : on le traite comme une absence de session.
    return null;
  }
}

/**
 * Utilisateur connecté, uniquement si le parcours d'accès est entièrement
 * franchi. Les pages du back-office ne voient jamais une session partielle.
 *
 * Le profil vient de l'API (GET /auth/me) : c'est le backend qui fait
 * autorité sur le rôle, jamais le cookie.
 */
export async function getSession(): Promise<AdminUser | null> {
  const session = await readSession();
  if (!session || session.stage !== "active" || !session.accessToken) {
    return null;
  }

  try {
    // Import différé : `client.ts` est `server-only` et importe ce module.
    const { apiFetch } = await import("@/lib/api/client");
    return mapProfil(await apiFetch<ProfilBackend>("/auth/me"));
  } catch {
    // Jetons révoqués ou API injoignable : session considérée comme absente.
    return null;
  }
}

/** Initiales utilisées comme avatar de repli. */
export const getInitials = (user: Pick<AdminUser, "firstName" | "lastName">) =>
  `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
