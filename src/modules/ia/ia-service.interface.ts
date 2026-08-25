/**
 * CONTRAT n°4 — Service IA partagé (NLP).
 *
 * Cette interface est DÉFINITIVE : elle sera consommée par la Fiche-pays
 * (synthèses), les Résumés de débats et le futur module Collecte (extraction
 * des valeurs depuis les textes scrapés). Seule l'implémentation changera :
 *  - StubIaService    : texte mécanique, aucune dépendance externe (repli/dev)
 *  - MistralIaService : appels réels à Mistral AI (MISTRAL_API_KEY)
 * Le choix se fait dans ia.module.ts selon la présence de la clé.
 */

/** Jeton d'injection NestJS : @Inject(IA_SERVICE) */
export const IA_SERVICE = 'IA_SERVICE';

/** Données transmises à l'IA pour rédiger la synthèse d'une thématique/pays */
export interface DonneesSynthese {
  paysOuZone: string;
  thematique: string;
  indicateurs: {
    critere: string;
    indicateur: string;
    /** Mesures triées de la plus ancienne à la plus récente */
    valeurs: { valeur: number; dateMesure: string }[];
  }[];
}

/** Référence d'un indicateur connu du référentiel (liste fermée des ateliers) */
export interface IndicateurConnu {
  id: string;
  libelle: string;
}

/** Valeur extraite d'un texte scrapé, proposée pour validation admin */
export interface PropositionValeur {
  indicateurId: string;
  valeur: number;
  dateMesure: string;
  source: string;
  /**
   * CITATION : passage verbatim du texte source d'où la valeur est tirée
   * (exigence du jury — chaque chiffre doit être vérifiable). Absent pour les
   * valeurs issues des connecteurs HTTP (la source API fait foi).
   */
  extrait?: string;
}

/** Données transmises à l'IA pour rédiger le résumé d'un débat terminé */
export interface DonneesResumeDebat {
  titre: string;
  thematique: string;
  description?: string | null;
  /** Verbatim du débat (ce qui a été réellement dit), dans l'ordre */
  transcription: { intervenant: string; texte: string }[];
  /** Affirmations soumises au vote pendant le live, avec leurs décomptes */
  affirmations: {
    texte: string;
    valides: number;
    invalides: number;
  }[];
}

/** Une donnée mesurée, sourcée, mise à disposition de l'assistant citoyen */
export interface DonneeMesuree {
  thematique: string;
  critere: string;
  indicateur: string;
  paysOuZone: string;
  valeur: number;
  annee: string;
  source: string;
}

/**
 * Texte déjà validé par l'équipe (synthèse publiée d'une fiche pays, contenu
 * vérifié du feed) — deuxième source de vérité de l'assistant, à côté des
 * valeurs chiffrées.
 */
export interface ReferenceValidee {
  titre: string;
  texte: string;
  source: string;
}

export interface DonneesVerification {
  /** L'affirmation soumise par le citoyen, telle quelle */
  affirmation: string;
  /** Les données mesurées et validées dont dispose la plateforme */
  donnees: DonneeMesuree[];
  /** Les textes validés par l'équipe (synthèses publiées, contenus vérifiés) */
  references: ReferenceValidee[];
  /**
   * Domaines de la liste blanche des sources (CEI, ANSTAT, Banque mondiale…) :
   * l'implémentation peut y mener une recherche web EN DIRECT — et nulle part
   * ailleurs. Vide : pas de recherche web.
   */
  domainesAutorises: string[];
}

/** Source web consultée pendant la vérification (domaine de la liste blanche) */
export interface SourceWeb {
  titre: string;
  url: string;
}

export interface ResultatVerification {
  verdict: 'COHERENT' | 'CONTREDIT' | 'NON_VERIFIABLE';
  /** Explication en français simple, appuyée uniquement sur les éléments cités */
  explication: string;
  /** Sous-ensemble des données fournies effectivement utilisées pour juger */
  elements: DonneeMesuree[];
  /** Sous-ensemble des références validées effectivement utilisées */
  references: ReferenceValidee[];
  /**
   * Sources web de la liste blanche réellement consultées pendant la
   * vérification — les URLs viennent des résultats de recherche, pas de la
   * mémoire du modèle.
   */
  sourcesWeb: SourceWeb[];
  /**
   * Contexte général issu des connaissances du modèle — JAMAIS compté dans le
   * verdict, toujours présenté à l'utilisateur comme « non vérifié par nos
   * sources ». Null si le modèle n'a rien d'utile ou de sûr à ajouter.
   */
  eclairage: string | null;
}

export interface IaService {
  /**
   * Rédige la synthèse d'une thématique pour un pays à partir des valeurs
   * mesurées. Le texte produit est un BROUILLON : il part toujours en
   * validation admin avant publication.
   */
  genererSyntheseThematique(donnees: DonneesSynthese): Promise<string>;

  /**
   * Analyse un texte brut (page scrapée, rapport) et en extrait les valeurs
   * chiffrées, rattachées aux indicateurs CONNUS du référentiel — l'IA ne
   * crée jamais de nouvel indicateur. Consommé par le futur module Collecte.
   */
  extraireValeurs(
    texteBrut: string,
    indicateursConnus: IndicateurConnu[],
  ): Promise<PropositionValeur[]>;

  /**
   * Rédige le résumé d'un débat terminé (CDC §6.4) à partir de son déroulé et
   * des résultats de vote. Brouillon soumis à validation humaine avant
   * publication dans le Feed.
   */
  genererResumeDebat(donnees: DonneesResumeDebat): Promise<string>;

  /**
   * À partir de TOUTES les données collectées sur un indicateur (plusieurs
   * sources), l'IA reformule une phrase claire et recommande la valeur la plus
   * fiable. Brouillon soumis à validation admin avant publication.
   */
  reformulerIndicateur(donnees: DonneesReformulation): Promise<string>;

  /**
   * Assistant citoyen de vérification des faits (CDC — fonctionnalité phare) :
   * confronte une affirmation aux SEULES données mesurées et validées de la
   * plateforme. Trois issues : cohérente, contredite, ou non vérifiable avec
   * nos données — jamais d'invention, chaque élément cité vient de la liste
   * fournie.
   */
  verifierAffirmation(
    donnees: DonneesVerification,
  ): Promise<ResultatVerification>;
}

/** Données transmises à l'IA pour reformuler un indicateur collecté */
export interface DonneesReformulation {
  indicateur: string;
  critere: string;
  thematique: string;
  paysOuZone: string;
  /** Ce que chaque source a rapporté (valeur la plus récente) */
  sources: { source: string; valeur: number; annee: string }[];
}
