/**
 * Rôles applicatifs — CONTRAT PARTAGÉ entre les deux développeurs (CDC §9.3).
 * Cet enum est définitif : le futur module Auth (Dev A) doit réutiliser
 * exactement ces valeurs dans le payload JWT.
 */
export enum Role {
  /** Utilisateur standard : lit le feed, vote, écrit des avis, participe aux débats */
  UTILISATEUR = 'UTILISATEUR',
  /** Point focal certifié : + publie des contenus, intervient dans les débats */
  POINT_FOCAL = 'POINT_FOCAL',
  /** Administrateur Laboratoire : + gestion complète (référentiel, modération, back-office) */
  ADMIN = 'ADMIN',
}
