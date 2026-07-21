/**
 * Cycle de vie d'un résumé de débat (même logique que les synthèses fiche-pays) :
 * généré → EN_ATTENTE_VALIDATION → PUBLIE (émet debat.resume.valide vers le Feed)
 *                                → REJETE (conservé pour traçabilité)
 */
export enum StatutResume {
  EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
  PUBLIE = 'PUBLIE',
  REJETE = 'REJETE',
}
