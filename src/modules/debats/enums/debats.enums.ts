/** Cycle de vie d'un débat : planifié → en cours (live) → terminé (replay/archive) */
export enum StatutDebat {
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
}

/** Rôle DANS un débat (indépendant du rôle applicatif global) */
export enum RoleParticipation {
  SPECTATEUR = 'SPECTATEUR',
  INTERVENANT = 'INTERVENANT',
  MODERATEUR = 'MODERATEUR',
}

/** Une affirmation est soumise au vote en direct tant qu'elle est OUVERTE */
export enum StatutAffirmation {
  OUVERTE = 'OUVERTE',
  FERMEE = 'FERMEE',
}

/** Signalement en direct d'une fausse information pendant le live */
export enum StatutSignalement {
  EN_ATTENTE = 'EN_ATTENTE',
  TRAITE = 'TRAITE',
}
