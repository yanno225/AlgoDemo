import { apiFetch } from "@/lib/api/client";
import { ROLES, type UserRole } from "@/lib/domain/roles";
import type { RoleBackend } from "@/lib/auth/session";
import type {
  CompteDetail,
  DecisionCompte,
  StatistiquesCompte,
} from "@/lib/domain/types";

/**
 * Comptes — branché sur `GET /auth/users` (réservé ADMIN).
 *
 * L'API renvoie la liste entière, sans pagination ni filtre : le tri et le
 * filtrage se font donc ici. À revoir si le nombre de comptes explose.
 */

/** Rôles tels que sérialisés par l'API, et leur équivalent côté front. */
const VERS_FRONT: Record<RoleBackend, UserRole> = {
  UTILISATEUR: ROLES.STANDARD,
  POINT_FOCAL: ROLES.POINT_FOCAL,
  ADMIN: ROLES.ADMIN_LABO,
};

/** Traduction inverse, pour `PATCH /auth/users/:id/role`. */
export const VERS_BACKEND: Record<UserRole, RoleBackend> = {
  [ROLES.STANDARD]: "UTILISATEUR",
  [ROLES.POINT_FOCAL]: "POINT_FOCAL",
  [ROLES.ADMIN_LABO]: "ADMIN",
};

interface CompteApi extends Omit<CompteDetail, "role"> {
  role: RoleBackend;
}

const mapCompte = (compte: CompteApi): CompteDetail => ({
  ...compte,
  role: VERS_FRONT[compte.role] ?? ROLES.STANDARD,
});

/** Tous les comptes, les plus récemment créés en tête. */
export async function listComptes(): Promise<CompteDetail[]> {
  const comptes = await apiFetch<CompteApi[]>("/auth/users");
  return comptes
    .map(mapCompte)
    .sort((a, b) => b.creeLe.localeCompare(a.creeLe));
}

/**
 * Un compte par son identifiant.
 *
 * L'API n'expose pas `GET /auth/users/:id` : on filtre la liste. Acceptable
 * tant que le volume reste modeste — à remplacer par une route dédiée le jour
 * où la liste sera paginée.
 */
export async function getCompte(id: string): Promise<CompteDetail | null> {
  const comptes = await listComptes();
  return comptes.find((compte) => compte.id === id) ?? null;
}

/** Activité citoyenne du compte — comptée en base, jamais estimée. */
export function getStatistiques(id: string): Promise<StatistiquesCompte> {
  return apiFetch<StatistiquesCompte>(`/auth/users/${id}/statistiques`);
}

interface DecisionApi extends Omit<DecisionCompte, "ancienRole" | "nouveauRole"> {
  ancienRole: RoleBackend | null;
  nouveauRole: RoleBackend | null;
}

/** Décisions administratives prises sur ce compte, la plus récente en tête. */
export async function getHistorique(id: string): Promise<DecisionCompte[]> {
  const decisions = await apiFetch<DecisionApi[]>(
    `/auth/users/${id}/historique`,
  );
  return decisions.map((decision) => ({
    ...decision,
    ancienRole: decision.ancienRole ? VERS_FRONT[decision.ancienRole] : null,
    nouveauRole: decision.nouveauRole ? VERS_FRONT[decision.nouveauRole] : null,
  }));
}

/** Compteurs des onglets de la liste. */
export function compterParEtat(comptes: CompteDetail[]) {
  return {
    tous: comptes.length,
    aValider: comptes.filter((c) => !c.compteValide && !c.estBloque).length,
    bloques: comptes.filter((c) => c.estBloque).length,
  };
}
