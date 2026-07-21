/**
 * Contrat partagé Dev A / Dev B (voir doc de répartition, §5, contrat #3).
 * Émis par le futur module Débats (Dev B) une fois qu'un résumé de débat a
 * été validé humainement (`valideHumainement`). Le Feed (Dev A) l'écoute et
 * publie automatiquement le résumé comme `Contenu` (voir DebatResumeListener).
 *
 * Émission côté Dev B (une fois le module Débats prêt) :
 *   this.eventEmitter.emit(DEBAT_RESUME_VALIDE, payload satisfies DebatResumeValidePayload);
 */
export const DEBAT_RESUME_VALIDE = 'debat.resume.valide';

export interface DebatResumeValidePayload {
  /** Identifiant du débat source (traçabilité, non stocké tel quel sur le Contenu) */
  debatId: string;
  titre: string;
  /** Résumé généré par IA puis validé humainement — devient le corps du Contenu */
  texteResume: string;
  /** Thématique de rattachement du débat (Référentiel) */
  thematiqueId: string;
  /** Identifiant du modérateur/point focal ayant validé le résumé */
  valideParUserId: string;
  urlReplay?: string;
}
