/**
 * Un SONDAGE est une consultation courte à question unique : même moteur,
 * même vote à bulletin secret, même publication des résultats — seule la
 * présentation diffère (onglet dédié côté mobile). Ce champ évite de
 * dupliquer toute la machinerie émargement/urne pour un second module.
 */
export enum TypeConsultation {
  CONSULTATION = 'CONSULTATION',
  SONDAGE = 'SONDAGE',
}
