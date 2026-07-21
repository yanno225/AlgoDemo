/**
 * Rôles utilisateur du projet AlgoDémo.
 * Source : Cahier des charges, section Sécurité.
 *
 * - standard     : utilisateur citoyen classique
 * - point_focal  : vérificateur / expert certifié
 * - admin_labo   : administrateur du Laboratoire / partenaire institutionnel
 */

export const ROLES = {
  STANDARD: 'standard',
  POINT_FOCAL: 'point_focal',
  ADMIN_LABO: 'admin_labo',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/** Rôles autorisés à créer des consultations (RG-CON-01) */
export const CONSULTATION_CREATOR_ROLES: readonly UserRole[] = [
  ROLES.ADMIN_LABO,
];

/** Rôles autorisés à publier du contenu dans le feed */
export const CONTENT_PUBLISHER_ROLES: readonly UserRole[] = [
  ROLES.ADMIN_LABO,
];

/** Rôles autorisés à modérer les avis écrits */
export const MODERATOR_ROLES: readonly UserRole[] = [
  ROLES.ADMIN_LABO,
  ROLES.POINT_FOCAL,
];
