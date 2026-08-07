/**
 * Contrat partagé Dev A / Dev B (voir doc de répartition, §5, contrat #6 : "Notifications").
 * N'importe quel module (y compris les futurs modules de Dev B — Débats, Résumés) peut
 * déclencher une notification en émettant l'un de ces événements via `EventEmitter2`.
 * Le module Notifications (Dev A) écoute `notif.*`, filtre par consentement RGPD
 * (`UsersService.findIdsConsentants`) et persiste + déclenche l'envoi push.
 *
 * Deux formes de payload :
 *  - Ciblée (`userIds` fourni par l'émetteur) : ex. les votants d'une consultation,
 *    l'auteur d'un avis modéré.
 *  - Diffusion (`userIds` omis) : le module Notifications résout lui-même tous les
 *    comptes consentants (ex. nouveau contenu publié, démarrage d'un débat).
 */
export const NOTIF_DEBAT_DEMARRE = 'notif.debat.demarre';
export const NOTIF_RESULTATS_PUBLIES = 'notif.resultats.publies';
export const NOTIF_CONTENU_PUBLIE = 'notif.contenu.publie';
export const NOTIF_MODERATION = 'notif.moderation';

interface NotificationPayloadBase {
  /** Sous-ensemble de destinataires (votants, auteur...) ; omis = diffusion à tous les comptes consentants */
  userIds?: string[];
}

export interface DebatDemarrePayload extends NotificationPayloadBase {
  debatId: string;
  titre: string;
}

export interface ResultatsPubliesPayload extends NotificationPayloadBase {
  consultationId: string;
  titre: string;
}

export interface ContenuPubliePayload extends NotificationPayloadBase {
  contenuId: string;
  titre: string;
}

export interface ModerationPayload extends NotificationPayloadBase {
  avisId: string;
  decision: 'APPROUVE' | 'REJETE';
}
