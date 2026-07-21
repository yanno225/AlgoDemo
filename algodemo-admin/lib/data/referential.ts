import type { Criterion, Indicator, ThematicReferential } from "@/lib/domain/types";
import type { ThematicId } from "@/lib/domain/thematics";

/**
 * Référentiel de modération : thématiques → critères → indicateurs → valeurs.
 *
 * C'est la grille d'analyse commune à tous les pays du programme. Les
 * thématiques sont fixes (RG-THE-01) ; seuls les critères et indicateurs
 * qu'elles portent sont administrables.
 *
 * TODO(backend) : GET /admin/referential, /admin/referential/:thematicId,
 * GET /admin/indicators/:id.
 */

const GENRE_CRITERIA: Criterion[] = [
  {
    id: "cri_1",
    label: "Égalité salariale",
    description:
      "Mesure les écarts de rémunération et l'accès aux responsabilités entre les femmes et les hommes.",
    indicators: [
      {
        id: "ind_1",
        code: "EGAL-01",
        label: "Écart de rémunération moyenne homme-femme par secteur",
        description:
          "Différence de salaire brut horaire moyen entre femmes et hommes, ventilée par secteur d'activité.",
        entries: [],
      },
      {
        id: "ind_2",
        code: "EGAL-02",
        label: "Proportion de femmes dans les postes de direction",
        description:
          "Part des femmes parmi les 10 % de postes les mieux rémunérés de l'organisation.",
        entries: [],
      },
      {
        id: "ind_3",
        code: "EGAL-03",
        label: "Indice d'égalité professionnelle obligatoire",
        description:
          "Score composite publié annuellement par les entreprises assujetties.",
        entries: [],
      },
    ],
  },
  {
    id: "cri_2",
    label: "Représentation médiatique",
    description:
      "Évalue la place accordée aux femmes dans les médias et les instances de parole publique.",
    indicators: [
      {
        id: "ind_4",
        code: "MEDIA-01",
        label: "Temps de parole des femmes en plateau",
        description:
          "Part du temps de parole attribué aux intervenantes dans les émissions d'information.",
        entries: [],
      },
      {
        id: "ind_5",
        code: "MEDIA-02",
        label: "Part des expertes citées en une",
        description:
          "Proportion de femmes identifiées comme expertes dans les articles de première page.",
        entries: [],
      },
    ],
  },
  {
    id: "cri_3",
    label: "Politiques familiales",
    description:
      "Suit les dispositifs publics de conciliation entre vie familiale et vie professionnelle.",
    indicators: [
      {
        id: "ind_6",
        code: "TRANS-04",
        label: "Taux de publication des données budgétaires",
        description:
          "Mesure le pourcentage de documents budgétaires officiels rendus publics via les plateformes nationales de données ouvertes, dans les délais légaux.",
        entries: [
          {
            id: "val_1",
            value: "78 %",
            country: "France",
            recordedAt: "2023-10-12T00:00:00.000Z",
            source: "Ministère des Finances",
          },
          {
            id: "val_2",
            value: "62 %",
            country: "Sénégal",
            recordedAt: "2023-09-05T00:00:00.000Z",
            source: "Portail Open Data SN",
          },
          {
            id: "val_3",
            value: "81 %",
            country: "France",
            recordedAt: "2023-07-22T00:00:00.000Z",
            source: "Etalab / Data.gouv.fr",
          },
          {
            id: "val_4",
            value: "Élevé",
            country: "Maroc",
            recordedAt: "2023-06-15T00:00:00.000Z",
            source: "Rapport annuel Transparence",
          },
          {
            id: "val_5",
            value: "54 %",
            country: "Côte d'Ivoire",
            recordedAt: "2023-05-30T00:00:00.000Z",
            source: "Direction Générale du Budget",
          },
          {
            id: "val_6",
            value: "69 %",
            country: "Tunisie",
            recordedAt: "2023-04-18T00:00:00.000Z",
            source: "Observatoire Budget Ouvert",
          },
        ],
      },
    ],
  },
];

/** Volumétrie affichée sur la liste des thématiques. */
const REFERENTIAL: ThematicReferential[] = [
  {
    thematicId: "genre_societe",
    criteriaCount: 8,
    indicatorsCount: 24,
    criteria: GENRE_CRITERIA,
  },
  { thematicId: "jeunesse_societe", criteriaCount: 6, indicatorsCount: 18, criteria: [] },
  { thematicId: "droit", criteriaCount: 12, indicatorsCount: 36, criteria: [] },
  { thematicId: "politique", criteriaCount: 10, indicatorsCount: 30, criteria: [] },
  { thematicId: "societe_vivant", criteriaCount: 7, indicatorsCount: 21, criteria: [] },
];

export async function listReferential(): Promise<ThematicReferential[]> {
  return REFERENTIAL;
}

export async function getThematicReferential(
  thematicId: string
): Promise<ThematicReferential | null> {
  return (
    REFERENTIAL.find((entry) => entry.thematicId === (thematicId as ThematicId)) ?? null
  );
}

export async function getIndicator(id: string): Promise<{
  indicator: Indicator;
  criterion: Criterion;
  thematicId: ThematicId;
} | null> {
  for (const thematic of REFERENTIAL) {
    for (const criterion of thematic.criteria) {
      const indicator = criterion.indicators.find((item) => item.id === id);
      if (indicator) {
        return { indicator, criterion, thematicId: thematic.thematicId };
      }
    }
  }
  return null;
}
