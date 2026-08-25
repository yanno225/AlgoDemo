/**
 * État renvoyé par l'action de connexion au formulaire.
 *
 * Volontairement dans son propre module : un fichier `"use server"` ne peut
 * exporter que des fonctions asynchrones, une constante y ferait échouer le
 * rendu de toute l'application.
 */
export type EtatConnexion =
  | { statut: "inactif" }
  | { statut: "erreur"; message: string }
  | { statut: "code_requis"; message?: string };

export const ETAT_CONNEXION_INITIAL: EtatConnexion = { statut: "inactif" };
