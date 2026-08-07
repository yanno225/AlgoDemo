/**
 * Contrat commun à toutes les sources de données automatiques.
 * Ajouter une source (API ouverte) = créer une classe qui implémente cette
 * interface et l'enregistrer dans le tableau SOURCE_CONNECTORS du module.
 * Le service de collecte les interroge TOUTES, sans rien d'autre à changer.
 */

/** Jeton d'injection du tableau de connecteurs */
export const SOURCE_CONNECTORS = 'SOURCE_CONNECTORS';

/** Indicateur du référentiel exposé aux connecteurs (pour le rattachement) */
export interface IndicateurRef {
  id: string;
  libelle: string;
}

/** Valeur brute rapportée par une source, prête à devenir une proposition */
export interface ValeurCollectee {
  indicateurId: string;
  valeur: number;
  /** AAAA-MM-JJ (on met le 1er janvier pour une donnée annuelle) */
  dateMesure: string;
  /** Provenance précise (nom de la source + série) */
  source: string;
}

export interface SourceConnector {
  /** Nom lisible de la source (ex. « Banque Mondiale ») */
  readonly nom: string;

  /**
   * Récupère, pour le pays donné, toutes les valeurs que cette source publie
   * pour NOS indicateurs (rattachées par indicateurId). Ne lève jamais : en cas
   * d'erreur réseau, renvoie ce qu'elle a pu obtenir (tableau éventuellement vide).
   */
  collecter(
    indicateurs: IndicateurRef[],
    codePays: string,
  ): Promise<ValeurCollectee[]>;
}
