/** Catégories fermées du formulaire mobile — le texte libre rendrait le tri impossible. */
export enum CategorieSignalement {
  VOIRIE = 'VOIRIE',
  ECLAIRAGE = 'ECLAIRAGE',
  DECHETS = 'DECHETS',
  EAU = 'EAU',
  SECURITE = 'SECURITE',
  DESINFORMATION = 'DESINFORMATION',
  AUTRE = 'AUTRE',
}

/** Cycle de vie d'un signalement : reçu → pris en charge → résolu (ou rejeté). */
export enum StatutSignalementCitoyen {
  RECU = 'RECU',
  EN_COURS = 'EN_COURS',
  RESOLU = 'RESOLU',
  REJETE = 'REJETE',
}
