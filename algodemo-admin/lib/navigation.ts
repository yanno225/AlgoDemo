import {
  MODERATOR_ROLES,
  USER_ADMIN_ROLES,
  CONSULTATION_CREATOR_ROLES,
  BACK_OFFICE_ROLES,
  hasRole,
  type UserRole,
} from "@/lib/domain/roles";

export type NavIcon =
  | "dashboard"
  | "accounts"
  | "moderation"
  | "debates"
  | "referential";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  /** Rôles autorisés à voir et atteindre cette section. */
  allowedRoles: readonly UserRole[];
}

/**
 * Sections du back-office, reprises de la maquette validée.
 *
 * Les permissions sont portées par la donnée, pas par les composants : la
 * barre latérale et la garde d'accès lisent cette même liste. Un rôle modifié
 * ici s'applique partout d'un coup.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Tableau de bord",
    icon: "dashboard",
    allowedRoles: BACK_OFFICE_ROLES,
  },
  {
    href: "/comptes",
    label: "Comptes",
    icon: "accounts",
    allowedRoles: USER_ADMIN_ROLES,
  },
  {
    href: "/moderation",
    label: "Modération",
    icon: "moderation",
    allowedRoles: MODERATOR_ROLES,
  },
  {
    href: "/debats",
    label: "Débats & consultations",
    icon: "debates",
    allowedRoles: CONSULTATION_CREATOR_ROLES,
  },
  {
    // Les points focaux consultent le référentiel pour arbitrer leurs
    // modérations ; seuls les administrateurs peuvent le modifier.
    href: "/referentiel",
    label: "Référentiel",
    icon: "referential",
    allowedRoles: MODERATOR_ROLES,
  },
];

/** Entrées visibles pour un rôle donné. */
export const getNavForRole = (role: UserRole | undefined): NavItem[] =>
  NAV_ITEMS.filter((item) => hasRole(role, item.allowedRoles));

/** Vérifie qu'un rôle a le droit d'atteindre un chemin donné. */
export const canAccessPath = (
  role: UserRole | undefined,
  pathname: string
): boolean => {
  const item = NAV_ITEMS
    // Le chemin le plus spécifique gagne : `/comptes/42` doit être évalué
    // contre `/comptes`, jamais contre la racine `/`.
    .filter((candidate) =>
      candidate.href === "/"
        ? pathname === "/"
        : pathname === candidate.href || pathname.startsWith(`${candidate.href}/`)
    )
    .sort((a, b) => b.href.length - a.href.length)[0];

  if (!item) return hasRole(role, BACK_OFFICE_ROLES);
  return hasRole(role, item.allowedRoles);
};
