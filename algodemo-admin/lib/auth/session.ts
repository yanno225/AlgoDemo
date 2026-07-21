import { cookies } from "next/headers";
import type { AdminUser } from "@/lib/domain/types";
import { ROLES } from "@/lib/domain/roles";

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
}

/**
 * Comptes de démonstration.
 *
 * TODO(backend) : à supprimer au branchement de POST /auth/login. Aucun
 * identifiant ne doit subsister dans le livrable final.
 */
export const DEMO_ACCOUNTS: Record<string, AdminUser> = {
  "admin@algodemo.org": {
    id: "user_admin",
    firstName: "Aminata",
    lastName: "Touré",
    email: "admin@algodemo.org",
    role: ROLES.ADMIN_LABO,
    isActive: true,
    createdAt: "2024-02-11T09:00:00.000Z",
  },
  "focal@algodemo.org": {
    id: "user_focal",
    firstName: "Jean",
    lastName: "Dupont",
    email: "focal@algodemo.org",
    role: ROLES.POINT_FOCAL,
    isActive: true,
    createdAt: "2022-05-12T09:00:00.000Z",
  },
};

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
 */
export async function getSession(): Promise<AdminUser | null> {
  const session = await readSession();
  if (!session || session.stage !== "active") return null;

  // TODO(backend) : remplacer par GET /auth/me.
  return DEMO_ACCOUNTS[session.email] ?? null;
}

/** Initiales utilisées comme avatar de repli. */
export const getInitials = (user: Pick<AdminUser, "firstName" | "lastName">) =>
  `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
