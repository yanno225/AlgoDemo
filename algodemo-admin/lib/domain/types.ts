import type { UserRole } from "./roles";
import type { ThematicId } from "./thematics";

/**
 * Modèle de données du back-office.
 *
 * Ces types décrivent la forme attendue des réponses de l'API. Ils sont
 * définis avant le branchement du backend pour que la couche mockée produise
 * exactement la même structure : le jour du branchement, seule
 * l'implémentation des services change, jamais les composants.
 *
 * Les dates sont des chaînes ISO 8601 — le formatage relève de l'affichage.
 */

// ─── Comptes ─────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  /**
   * Compte dont les données personnelles sont chiffrées et non lisibles par
   * l'administration (RG-USR-07). Le nom affiché est alors un pseudonyme.
   */
  isAnonymised?: boolean;
}

// Les compteurs d'activité et l'historique des rôles ont été retirés : ils
// n'existaient que dans la maquette. L'API n'expose pas ces données — voir
// `CompteDetail` plus bas pour l'état réel d'un compte.

// ─── Modération des avis ─────────────────────────────────────────────
// Les types maquette de modération (Contribution, Signalement enrichi,
// théâtre de triangulation) ont été retirés : la couche réelle est typée
// dans `lib/data/moderation.ts`, au plus près de l'API.

// ─── Débats et consultations (encore mockés) ─────────────────────────
export type DebateStatus = "live" | "scheduled" | "closed";

export interface Speaker {
  id: string;
  name: string;
  expertise: string;
  avatarUrl?: string;
  isCertified: boolean;
}

export interface Debate {
  id: string;
  title: string;
  thematicId: ThematicId;
  status: DebateStatus;
  moderator: Pick<AdminUser, "id" | "firstName" | "lastName">;
  speakers: Speaker[];
  startsAt: string;
  endsAt?: string;
  participants?: number;
  /** Renseigné pour les débats terminés dont le résumé attend validation. */
  summaryStatus?: "pending" | "published";
}

export type ConsultationStatus = "open" | "scheduled" | "closed";

export interface Consultation {
  id: string;
  title: string;
  /** RG-CON-02 : une consultation peut porter plusieurs thématiques. */
  thematicIds: ThematicId[];
  status: ConsultationStatus;
  opensAt: string;
  closesAt: string;
  participants: number;
  /** Taux de participation atteint, en pourcentage. */
  participationRate: number;
  /** RG-CON-09 : résumé vulgarisé du projet de loi rattaché. */
  plainSummary?: string;
  attachedBillId?: string;
}

/** Synthèse produite par l'IA, soumise à validation humaine avant diffusion. */
export interface AiSummary {
  id: string;
  title: string;
  scope: "debate" | "consultation";
  generatedAt: string;
  excerpt: string;
}

// Le référentiel (thématiques › critères › indicateurs) est typé dans
// `lib/data/referentiel.ts`, au plus près de l'API qui le sert. Les anciens
// types maquette (codes EGAL-01, descriptions, valeurs par pays inventées)
// ont été retirés : l'API ne porte que des libellés.

// ─── Activité et indicateurs de pilotage ─────────────────────────────
export interface ActivityEvent {
  id: string;
  label: string;
  detail: string;
  at: string;
}

/** Enveloppe de pagination — forme imposée à toutes les listes de l'API. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

// ─── Comptes (branchés sur GET /auth/users) ──────────────────────────

/**
 * Compte tel que l'API le décrit réellement.
 *
 * `AdminUser` ci-dessus date de la phase mockée et réduisait l'état du compte
 * à un seul booléen `isActive` ; l'API distingue en fait quatre états
 * indépendants, qu'un back-office doit pouvoir lire et corriger séparément.
 */
export interface CompteDetail {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  role: UserRole;
  /** L'adresse email a été confirmée par un code. */
  emailVerifie: boolean;
  /** Le compte a été validé par un administrateur (§9.3). */
  compteValide: boolean;
  /** Accès suspendu par un administrateur. */
  estBloque: boolean;
  /** Second facteur TOTP activé — obligatoire pour voter aux consultations. */
  deuxFaActif: boolean;
  consentementNotifications: boolean;
  politiqueConfidentialiteAccepteeLe: string | null;
  /** Données personnelles effacées à la demande (RG-USR-07). */
  anonymise: boolean;
  creeLe: string;
}

/** Activité citoyenne d'un compte (GET /auth/users/:id/statistiques). */
export interface StatistiquesCompte {
  avisDeposes: number;
  avisApprouves: number;
  votesConsultations: number;
  votesDebats: number;
  debatsRejoints: number;
  prisesDeParole: number;
  signalementsEmis: number;
}

export type TypeDecision = "ROLE" | "VALIDATION" | "BLOCAGE";

/**
 * Décision administrative portée sur un compte
 * (GET /auth/users/:id/historique). Journal en ajout seul.
 */
export interface DecisionCompte {
  id: string;
  userCibleId: string;
  decideParUserId: string;
  type: TypeDecision;
  ancienRole: UserRole | null;
  nouveauRole: UserRole | null;
  actif: boolean | null;
  decideLe: string;
}

// ─── Collecte / veille ───────────────────────────────────────────────
// Ces types reprennent VOLONTAIREMENT les noms de champs français du
// backend (module `collecte`) : ils sont consommés tels que sérialisés par
// l'API, sans couche de traduction, contrairement aux types ci-dessus qui
// datent de la phase mockée.

export type StatutProposition = "EN_ATTENTE" | "VALIDEE" | "REJETEE";

/** Valeur proposée par la collecte, en attente de validation humaine. */
export interface PropositionValeur {
  id: string;
  indicateur: {
    id: string;
    libelle: string;
    critere?: { libelle: string; thematique?: { libelle: string } };
  };
  valeur: number;
  dateMesure: string;
  paysOuZone: string;
  source: string;
  /** Citation verbatim justifiant le chiffre (extraction IA uniquement). */
  extrait: string | null;
  urlSource: string | null;
  statut: StatutProposition;
  collecteLe: string;
}

/** Un indicateur vu par plusieurs sources — cœur de la triangulation. */
export interface LigneTriangulation {
  indicateur: string;
  critere: string;
  thematique: string;
  sources: {
    source: string;
    valeur: number;
    annee: string;
    statut: StatutProposition;
    propositionId: string;
  }[];
  /** Vrai si ≥ 2 sources et écart max/min ≤ 10 % de la moyenne. */
  concordance: boolean;
  /** Nombre de sources distinctes = niveau de vérification. */
  niveauVerification: number;
}

/** Source de la liste blanche : rien n'est ingéré en dehors. */
export interface SourceAutorisee {
  id: string;
  libelle: string;
  domaine: string | null;
  description: string | null;
  active: boolean;
  creeLe: string;
}

/** Bilan renvoyé par un lancement de collecte. */
export interface BilanCollecte {
  parSource: { source: string; propositions: number }[];
  propositionsCreees: number;
  doublonsIgnores: number;
}
