/**
 * Cycle de vie d'une synthèse générée par l'IA :
 * générée → EN_ATTENTE_VALIDATION (invisible du public)
 *         → PUBLIEE (validée par l'admin, visible dans la fiche-pays)
 *         → REJETEE (écartée par l'admin, conservée pour traçabilité)
 */
export enum StatutSynthese {
  EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
  PUBLIEE = 'PUBLIEE',
  REJETEE = 'REJETEE',
}
