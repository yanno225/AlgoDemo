/**
 * Rôles utilisateur du projet AlgoDémo.
 * Source : cahier des charges, section Sécurité.
 *
 * ⚠️ Miroir de `algodemo/constants/roles.ts` (application mobile). Les deux
 * fichiers doivent rester identiques : toute divergence ferait diverger les
 * permissions affichées sur mobile de celles appliquées au back-office.
 */

export const ROLES = {
  STANDARD: "standard",
  POINT_FOCAL: "point_focal",
  ADMIN_LABO: "admin_labo",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/** Rôles autorisés à créer des consultations (RG-CON-01). */
export const CONSULTATION_CREATOR_ROLES: readonly UserRole[] = [ROLES.ADMIN_LABO];

/** Rôles autorisés à publier du contenu dans le feed. */
export const CONTENT_PUBLISHER_ROLES: readonly UserRole[] = [ROLES.ADMIN_LABO];

/** Rôles autorisés à modérer les avis écrits et les signalements. */
export const MODERATOR_ROLES: readonly UserRole[] = [
  ROLES.ADMIN_LABO,
  ROLES.POINT_FOCAL,
];

/** Rôles autorisés à administrer les comptes et les rôles. */
export const USER_ADMIN_ROLES: readonly UserRole[] = [ROLES.ADMIN_LABO];

/**
 * Rôles ayant accès au back-office.
 *
 * Un citoyen `standard` n'a rien à y faire : il utilise l'application mobile.
 */
export const BACK_OFFICE_ROLES: readonly UserRole[] = [
  ROLES.ADMIN_LABO,
  ROLES.POINT_FOCAL,
];

export const ROLE_LABELS: Record<UserRole, string> = {
  [ROLES.STANDARD]: "Citoyen",
  [ROLES.POINT_FOCAL]: "Point focal",
  [ROLES.ADMIN_LABO]: "Administrateur Laboratoire",
};

export const hasRole = (
  role: UserRole | undefined,
  allowed: readonly UserRole[]
): boolean => (role ? allowed.includes(role) : false);
