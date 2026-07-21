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

/** Compteurs d'activité citoyenne affichés sur une fiche compte. */
export interface AccountActivity {
  contributions: number;
  votes: number;
  debates: number;
}

export type RoleEventType = "created" | "certified" | "revoked";

/** Trace d'un changement de rôle — exigence d'auditabilité. */
export interface RoleEvent {
  id: string;
  type: RoleEventType;
  label: string;
  at: string;
  by?: string;
}

export interface AccountDetail extends AdminUser {
  activity: AccountActivity;
  roleHistory: RoleEvent[];
}

// ─── Modération des avis ─────────────────────────────────────────────
export type ModerationStatus = "new" | "in_progress" | "handled" | "rejected";

export interface Contribution {
  id: string;
  author: Pick<AdminUser, "id" | "firstName" | "lastName">;
  /** Consultation ou débat auquel se rattache l'avis. */
  context: string;
  thematicId: ThematicId;
  body: string;
  status: ModerationStatus;
  submittedAt: string;
}

// ─── Signalements citoyens ───────────────────────────────────────────
export interface SignalementHistoryEntry {
  id: string;
  label: string;
  at: string;
  by: string;
}

export interface Signalement {
  id: string;
  reference: string;
  category: string;
  /** Famille de signalement : voirie, nuisance, désinformation… */
  tag: string;
  description: string;
  location: string;
  photoUrl?: string;
  status: ModerationStatus;
  reporter: string;
  reportedAt: string;
  /** Note interne, jamais exposée au citoyen. */
  internalNote?: string;
  history: SignalementHistoryEntry[];
}

// ─── Vérification / triangulation (RG-FEED-01) ───────────────────────
export type TriangulationOrigin = "ai" | "point_focal" | "investigation";

export type TriangulationStepStatus =
  | "success"
  | "validated"
  | "pending"
  | "blocked";

export interface TriangulationStep {
  step: 1 | 2 | 3;
  label: string;
  status: TriangulationStepStatus;
  detail: string;
  by?: string;
}

export type VerificationPriority = "high" | "normal";

export interface VerificationSource {
  id: string;
  label: string;
  /** Nature de la source : gouvernementale, média indépendant, universitaire… */
  kind: string;
}

export interface VerificationItem {
  id: string;
  reference: string;
  title: string;
  excerpt: string;
  origin: TriangulationOrigin;
  priority: VerificationPriority;
  /** Synthèse de l'étape courante, telle qu'affichée sur la carte. */
  headline: string;
  summary: string;
  postedAt: string;
  shares: number;
  sources: VerificationSource[];
  steps: TriangulationStep[];
}

// ─── Débats et consultations ─────────────────────────────────────────
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

// ─── Référentiel ─────────────────────────────────────────────────────
export interface Indicator {
  id: string;
  code: string;
  label: string;
  description: string;
  entries: IndicatorEntry[];
}

export interface IndicatorEntry {
  id: string;
  /** Valeur mesurée : pourcentage, ou libellé qualitatif (« Élevé »). */
  value: string;
  country: string;
  recordedAt: string;
  source: string;
}

export interface Criterion {
  id: string;
  label: string;
  description: string;
  indicators: Indicator[];
}

export interface ThematicReferential {
  thematicId: ThematicId;
  criteriaCount: number;
  indicatorsCount: number;
  criteria: Criterion[];
}

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
