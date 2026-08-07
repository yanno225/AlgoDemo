/**
 * Cycle d'une valeur proposée par la collecte automatique :
 * EN_ATTENTE (proposée par un job) → VALIDEE (l'admin l'accepte → ValeurIndicateur)
 *                                  → REJETEE (écartée, conservée pour traçabilité)
 */
export enum StatutProposition {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDEE = 'VALIDEE',
  REJETEE = 'REJETEE',
}
