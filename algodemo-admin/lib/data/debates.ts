import type {
  AiSummary,
  Consultation,
  Debate,
  Speaker,
} from "@/lib/domain/types";

/**
 * Débats encadrés, consultations citoyennes et synthèses IA.
 *
 * TODO(backend) : GET /admin/debates, /admin/consultations,
 * /admin/ai-summaries — puis POST pour la création.
 */

const DEBATES: Debate[] = [
  {
    id: "deb_1",
    title: "Avenir du rail : plan de financement 2030",
    thematicId: "politique",
    status: "live",
    moderator: { id: "acc_3", firstName: "Marie", lastName: "Vallet" },
    speakers: [],
    startsAt: "2026-07-21T14:00:00.000Z",
    participants: 1240,
  },
  {
    id: "deb_2",
    title: "IA à l'école : alliée ou menace ?",
    thematicId: "jeunesse_societe",
    status: "scheduled",
    moderator: { id: "acc_3", firstName: "Marie", lastName: "Vallet" },
    speakers: [],
    startsAt: "2026-10-15T14:00:00.000Z",
    endsAt: "2026-10-15T16:00:00.000Z",
  },
  {
    id: "deb_3",
    title: "Déserts médicaux : quelles solutions locales ?",
    thematicId: "societe_vivant",
    status: "scheduled",
    moderator: { id: "acc_3", firstName: "Marie", lastName: "Vallet" },
    speakers: [],
    startsAt: "2026-10-18T10:00:00.000Z",
    endsAt: "2026-10-18T11:30:00.000Z",
  },
  {
    id: "deb_4",
    title: "Taxe carbone : les conclusions",
    thematicId: "societe_vivant",
    status: "closed",
    moderator: { id: "acc_3", firstName: "Marie", lastName: "Vallet" },
    speakers: [],
    startsAt: "2026-07-20T18:00:00.000Z",
    participants: 426,
    summaryStatus: "pending",
  },
  {
    id: "deb_5",
    title: "Semaine de 4 jours",
    thematicId: "droit",
    status: "closed",
    moderator: { id: "acc_3", firstName: "Marie", lastName: "Vallet" },
    speakers: [],
    startsAt: "2026-10-02T18:00:00.000Z",
    participants: 1200,
    summaryStatus: "published",
  },
];

const CONSULTATIONS: Consultation[] = [
  {
    id: "con_1",
    title: "Transition écologique : plan de rénovation énergétique 2026",
    thematicIds: ["societe_vivant"],
    status: "open",
    opensAt: "2026-07-01T00:00:00.000Z",
    closesAt: "2026-08-04T23:59:00.000Z",
    participants: 1240,
    participationRate: 74,
  },
  {
    id: "con_2",
    title: "Mobilités douces : extension des pistes cyclables Est",
    thematicIds: ["politique"],
    status: "open",
    opensAt: "2026-07-10T00:00:00.000Z",
    closesAt: "2026-07-25T23:59:00.000Z",
    participants: 856,
    participationRate: 42,
  },
  {
    id: "con_3",
    title: "Réforme de l'accès prioritaire au parc HLM",
    thematicIds: ["droit"],
    status: "scheduled",
    opensAt: "2026-11-01T00:00:00.000Z",
    closesAt: "2026-12-15T23:59:00.000Z",
    participants: 0,
    participationRate: 0,
  },
  {
    id: "con_4",
    title: "Maisons de santé en milieu rural",
    thematicIds: ["societe_vivant"],
    status: "scheduled",
    opensAt: "2026-12-12T00:00:00.000Z",
    closesAt: "2027-01-20T23:59:00.000Z",
    participants: 0,
    participationRate: 0,
  },
  {
    id: "con_5",
    title: "Budget participatif : festivals 2026",
    thematicIds: ["genre_societe"],
    status: "closed",
    opensAt: "2026-02-01T00:00:00.000Z",
    closesAt: "2026-04-30T23:59:00.000Z",
    participants: 3100,
    participationRate: 68,
  },
  {
    id: "con_6",
    title: "Réaménagement de la place du Marché",
    thematicIds: ["politique"],
    status: "closed",
    opensAt: "2026-01-05T00:00:00.000Z",
    closesAt: "2026-03-10T23:59:00.000Z",
    participants: 1870,
    participationRate: 42,
  },
];

const AI_SUMMARIES: AiSummary[] = [
  {
    id: "sum_1",
    title: "Synthèse — Débat Rail",
    scope: "debate",
    generatedAt: "2026-07-21T12:00:00.000Z",
    excerpt:
      "Le débat fait ressortir un accord sur la priorité au fret, et un désaccord persistant sur le financement des lignes secondaires.",
  },
  {
    id: "sum_2",
    title: "Rapport — Consultations Climat",
    scope: "consultation",
    generatedAt: "2026-07-20T17:30:00.000Z",
    excerpt:
      "Les contributions convergent vers une demande d'aides ciblées sur les logements les plus énergivores.",
  },
  {
    id: "sum_3",
    title: "Synthèse — Énergies renouvelables",
    scope: "consultation",
    generatedAt: "2026-07-21T13:50:00.000Z",
    excerpt:
      "Forte adhésion au solaire en toiture, réserves exprimées sur l'éolien en zone périurbaine.",
  },
];

/** Intervenants certifiés proposés à la composition d'un débat. */
const SPEAKERS: Speaker[] = [
  {
    id: "spk_1",
    name: "Dr. Marc Antoine",
    expertise: "Expert climatologue",
    isCertified: true,
  },
  {
    id: "spk_2",
    name: "Sarah K. Elbaz",
    expertise: "Juriste constitutionnelle",
    isCertified: true,
  },
  {
    id: "spk_3",
    name: "Éléonore Bailly",
    expertise: "Administratrice senior",
    isCertified: true,
  },
];

export async function listDebates(): Promise<Debate[]> {
  return DEBATES;
}

export async function listConsultations(): Promise<Consultation[]> {
  return CONSULTATIONS;
}

export async function listAiSummaries(): Promise<AiSummary[]> {
  return AI_SUMMARIES;
}

export async function listSpeakers(): Promise<Speaker[]> {
  return SPEAKERS;
}
