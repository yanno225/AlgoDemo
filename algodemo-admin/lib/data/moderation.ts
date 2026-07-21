import type {
  Contribution,
  Signalement,
  VerificationItem,
} from "@/lib/domain/types";

/**
 * File de modération : avis citoyens, signalements et triangulation.
 *
 * TODO(backend) : GET /admin/moderation/contributions, /signalements,
 * /verifications — chacune paginée et filtrable par statut.
 */

const CONTRIBUTIONS: Contribution[] = [
  {
    id: "ctr_1",
    author: { id: "acc_10", firstName: "Marc", lastName: "Dupont" },
    context: "Consultation Rail 2030",
    thematicId: "politique",
    body: "Le plan rail est insuffisant pour les zones rurales, il faudrait doubler les fréquences pour encourager le report modal réel.",
    status: "new",
    submittedAt: "2026-07-21T14:20:00.000Z",
  },
  {
    id: "ctr_2",
    author: { id: "acc_11", firstName: "Sophie", lastName: "V." },
    context: "Réforme lycée",
    thematicId: "jeunesse_societe",
    body: "Il est crucial d'intégrer des modules d'éducation aux médias dès la seconde pour lutter contre les deepfakes.",
    status: "new",
    submittedAt: "2026-07-21T13:05:00.000Z",
  },
  {
    id: "ctr_3",
    author: { id: "acc_12", firstName: "Jean-Luc", lastName: "B." },
    context: "Plan solaire",
    thematicId: "societe_vivant",
    body: "Pourquoi ne pas obliger l'installation de panneaux solaires sur tous les parkings de supermarchés dès 2025 ?",
    status: "in_progress",
    submittedAt: "2026-07-21T12:40:00.000Z",
  },
];

const SIGNALEMENTS: Signalement[] = [
  {
    id: "sig_842",
    reference: "#842",
    category: "Voirie & propreté",
    tag: "Voirie",
    description:
      "Un dépôt sauvage important a été constaté à l'angle de la rue des Lilas. Plusieurs sacs poubelles et des encombrants gênent le passage des piétons et des poussettes depuis hier soir.",
    location: "12 Rue des Lilas, Abidjan",
    photoUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=900",
    status: "new",
    reporter: "Marc Dupont",
    reportedAt: "2026-07-20T18:32:00.000Z",
    history: [
      {
        id: "sh_1",
        label: "Signalement validé par la modération",
        at: "2026-07-21T09:15:00.000Z",
        by: "admin_julie",
      },
      {
        id: "sh_2",
        label: "Signalement créé",
        at: "2026-07-20T18:32:00.000Z",
        by: "Marc Dupont",
      },
    ],
  },
  {
    id: "sig_841",
    reference: "#841",
    category: "Désinformation",
    tag: "Désinformation",
    description:
      "Signalement d'une publication relayant des chiffres erronés sur le budget municipal, largement partagée en story.",
    location: "Avenue de la République, Abidjan",
    status: "new",
    reporter: "Marc D. (Citoyen certifié)",
    reportedAt: "2026-07-21T14:20:00.000Z",
    history: [
      {
        id: "sh_3",
        label: "Signalement créé",
        at: "2026-07-21T14:20:00.000Z",
        by: "Marc D.",
      },
    ],
  },
  {
    id: "sig_840",
    reference: "#840",
    category: "Nuisance sonore",
    tag: "Nuisance",
    description:
      "Pollution sonore persistante signalée à proximité du futur parc démocratique par plusieurs riverains.",
    location: "Rue des Tulipes, Yamoussoukro",
    status: "in_progress",
    reporter: "Léa G.",
    reportedAt: "2026-07-21T11:05:00.000Z",
    history: [
      {
        id: "sh_4",
        label: "Pris en charge par la modération",
        at: "2026-07-21T11:40:00.000Z",
        by: "admin_julie",
      },
      {
        id: "sh_5",
        label: "Signalement créé",
        at: "2026-07-21T11:05:00.000Z",
        by: "Léa G.",
      },
    ],
  },
  {
    id: "sig_839",
    reference: "#839",
    category: "Environnement",
    tag: "Environnement",
    description:
      "Décharge sauvage identifiée en bordure de forêt, avec présence de déchets de chantier.",
    location: "Forêt du Banco, Abidjan",
    status: "handled",
    reporter: "Association Éco-Quartier",
    reportedAt: "2026-07-20T09:00:00.000Z",
    history: [
      {
        id: "sh_6",
        label: "Traité — transmis aux services techniques",
        at: "2026-07-20T15:00:00.000Z",
        by: "admin_julie",
      },
    ],
  },
];

const VERIFICATIONS: VerificationItem[] = [
  {
    id: "ver_1",
    reference: "#VR-8829-01",
    title: "Analyse impact environnemental A69",
    excerpt:
      "Selon des documents récemment déclassifiés, le projet de loi sur la biodiversité urbaine dissimulerait un transfert massif de fonds publics vers des intérêts privés non identifiés dans le secteur de l'énergie renouvelable.",
    origin: "ai",
    priority: "high",
    headline: "Résultat IA",
    summary:
      "Concordance établie à 85 % avec les rapports du GIEC et les publications officielles de l'État. Données chiffrées cohérentes.",
    postedAt: "2026-07-18T09:00:00.000Z",
    shares: 4300,
    sources: [
      { id: "src_1", label: "Doc_Biodiv_Loi_2023", kind: "Source gouvernementale" },
      { id: "src_2", label: "Article Le Monde — Anz", kind: "Média indépendant" },
    ],
    steps: [
      {
        step: 1,
        label: "IA — Analyse sémantique",
        status: "success",
        detail:
          "Sources corrélées à 85 %. Aucune manipulation syntaxique détectée dans le corpus de référence.",
      },
      {
        step: 2,
        label: "Point focal technique",
        status: "validated",
        detail: "Validé par Jean D. (expert politiques publiques).",
        by: "Jean Dupont",
      },
      {
        step: 3,
        label: "Investigation finale",
        status: "pending",
        detail:
          "Investigation de terrain en cours pour confirmer l'origine des fuites mentionnées.",
      },
    ],
  },
  {
    id: "ver_2",
    reference: "#VR-8830-02",
    title: "Réforme du temps de travail 2024",
    excerpt:
      "Analyse comparative des accords de branche signés depuis la réforme, et de leur effet réel sur la durée hebdomadaire moyenne.",
    origin: "point_focal",
    priority: "normal",
    headline: "Certification expert",
    summary:
      "Vérifié par J. Dupont (expert éco.). Les sources syndicales et patronales sont correctement citées. Prêt pour diffusion.",
    postedAt: "2026-07-17T11:30:00.000Z",
    shares: 890,
    sources: [
      { id: "src_3", label: "Accords de branche 2024", kind: "Source gouvernementale" },
    ],
    steps: [
      { step: 1, label: "IA — Analyse sémantique", status: "success", detail: "Aucune incohérence détectée." },
      {
        step: 2,
        label: "Point focal technique",
        status: "validated",
        detail: "Certification accordée par J. Dupont.",
        by: "Jean Dupont",
      },
      { step: 3, label: "Investigation finale", status: "validated", detail: "Aucune investigation requise." },
    ],
  },
  {
    id: "ver_3",
    reference: "#VR-8831-03",
    title: "Déclaration patrimoine élu local",
    excerpt:
      "Comparaison entre la déclaration publiée et les registres fonciers accessibles au public.",
    origin: "investigation",
    priority: "high",
    headline: "Alerte bloquante",
    summary:
      "Discordance majeure entre la source primaire et la citation. Suspicion de détournement de contexte. Nécessite une contre-enquête manuelle.",
    postedAt: "2026-07-19T16:10:00.000Z",
    shares: 12400,
    sources: [
      { id: "src_4", label: "Registre foncier national", kind: "Source gouvernementale" },
    ],
    steps: [
      { step: 1, label: "IA — Analyse sémantique", status: "success", detail: "Extraction réalisée." },
      {
        step: 2,
        label: "Point focal technique",
        status: "blocked",
        detail: "Discordance majeure relevée entre la source primaire et la citation.",
      },
      { step: 3, label: "Investigation finale", status: "pending", detail: "Contre-enquête manuelle à ouvrir." },
    ],
  },
  {
    id: "ver_4",
    reference: "#VR-8832-04",
    title: "Étude sur la biodiversité urbaine",
    excerpt:
      "Recensement des espèces observées dans les corridors écologiques des zones périurbaines.",
    origin: "ai",
    priority: "normal",
    headline: "Analyse en cours",
    summary:
      "Extraction des métadonnées et croisement avec les bases de données universitaires en cours.",
    postedAt: "2026-07-21T08:00:00.000Z",
    shares: 210,
    sources: [],
    steps: [
      { step: 1, label: "IA — Analyse sémantique", status: "pending", detail: "Extraction en cours." },
      { step: 2, label: "Point focal technique", status: "pending", detail: "En attente de l'étape 1." },
      { step: 3, label: "Investigation finale", status: "pending", detail: "En attente." },
    ],
  },
];

export async function listContributions(): Promise<Contribution[]> {
  return CONTRIBUTIONS;
}

export async function listSignalements(): Promise<Signalement[]> {
  return SIGNALEMENTS;
}

export async function getSignalement(id: string): Promise<Signalement | null> {
  return SIGNALEMENTS.find((item) => item.id === id) ?? null;
}

export async function listVerifications(): Promise<VerificationItem[]> {
  return VERIFICATIONS;
}

export async function getVerification(id: string): Promise<VerificationItem | null> {
  return VERIFICATIONS.find((item) => item.id === id) ?? null;
}

/** Compteurs affichés dans les onglets et sur le tableau de bord. */
export async function getModerationCounts() {
  return {
    contributions: CONTRIBUTIONS.length,
    signalements: SIGNALEMENTS.length,
    verifications: VERIFICATIONS.length,
  };
}
