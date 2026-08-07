/**
 * Fiche pays — indicateurs de santé démocratique.
 *
 * Pilote : Côte d'Ivoire. L'extension aux 19 pays du programme est prévue par
 * la feuille de route ; la structure ci-dessous est déjà multi-pays pour
 * l'accueillir sans refonte.
 *
 * ⚠️ Données illustratives. TODO(backend) : remplacer par
 * GET /fiche-pays/{pays}. La forme de `history` reproduit exactement le champ
 * `valeurs` du backend (`valeur` / `dateMesure` / `source`, trié du plus
 * récent au plus ancien) : la bascule vers les données réelles se fera sans
 * toucher aux écrans.
 */

export type DomainId = 'politique' | 'droit' | 'societe' | 'numerique';

/** Une mesure datée d'un indicateur — miroir du `valeurs[]` du backend. */
export interface IndicatorValue {
  valeur: number;
  /** Date de mesure, ISO `AAAA-MM-JJ` (comme le backend). */
  dateMesure: string;
  source: string;
}

export interface CountryIndicator {
  id: string;
  /** Libellé court de l'indicateur. */
  labelKey: string;
  /** Ce que mesure l'indicateur, en une phrase (affiché dans le détail). */
  description: string;
  /** Unité de la valeur : `%` pour un taux, `''` pour un décompte. */
  unit: string;
  /**
   * Sens de lecture : `up` = « plus c'est haut, mieux c'est » (participation),
   * `down` = « plus c'est bas, mieux c'est » (cas de violences, chômage).
   * Détermine la couleur de la tendance dans le détail.
   */
  goodDirection: 'up' | 'down';
  /** Historique des mesures, du plus récent au plus ancien. */
  history: IndicatorValue[];
}

export interface CountryDomain {
  id: DomainId;
  /** Titre de la section affichée pour ce domaine. */
  sectionTitleKey: string;
  /** Jeton de couleur de la thématique dans `colors.thematic`. */
  colorToken: 'politique' | 'droit' | 'genreSociete' | 'societeVivant';
  indicators: CountryIndicator[];
}

export interface CountryProfile {
  /** Code ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  /** Emoji drapeau, utilisé comme repère visuel léger. */
  flag: string;
  updatedAt: string;
  /** Nombre de sources agrégées pour la synthèse. */
  sourceCount: number;
  aiSynthesis: string;
  didYouKnow: string;
  domains: CountryDomain[];
}

// ─── Accès dérivés (l'écran lit la valeur courante, pas tout l'historique) ──

/** Dernière valeur mesurée d'un indicateur (l'entrée la plus récente). */
export const latestValue = (indicator: CountryIndicator): number =>
  indicator.history[0]?.valeur ?? 0;

/** Source de la dernière mesure. */
export const latestSource = (indicator: CountryIndicator): string =>
  indicator.history[0]?.source ?? '';

/**
 * Variation entre les deux dernières mesures, en points.
 * `null` si l'historique ne compte qu'une seule valeur.
 */
export const latestDelta = (indicator: CountryIndicator): number | null => {
  if (indicator.history.length < 2) return null;
  return (
    Math.round((indicator.history[0].valeur - indicator.history[1].valeur) * 10) / 10
  );
};

export const COTE_DIVOIRE: CountryProfile = {
  code: 'CI',
  name: "Côte d'Ivoire",
  flag: '🇨🇮',
  updatedAt: '12 Oct. 2024',
  sourceCount: 143,
  aiSynthesis:
    "La situation démocratique en Côte d'Ivoire progresse, portée par le renforcement des institutions locales et la décentralisation. La liberté de la presse et l'accès à l'information s'améliorent, tandis que la participation citoyenne aux consultations reste à consolider.",
  didYouKnow:
    "La Côte d'Ivoire a gagné 7 places au classement mondial de la liberté de la presse depuis 2022, portée par de nouvelles protections pour les journalistes d'investigation.",
  domains: [
    {
      id: 'politique',
      sectionTitleKey: 'Gouvernance & participation',
      colorToken: 'politique',
      indicators: [
        {
          id: 'part_elec',
          labelKey: 'Participation électorale',
          description:
            "Part des électeurs inscrits ayant voté aux dernières élections nationales.",
          unit: '%',
          goodDirection: 'up',
          history: [
            { valeur: 54, dateMesure: '2023-01-01', source: "CEI Côte d'Ivoire, 2023" },
            { valeur: 51, dateMesure: '2021-01-01', source: "CEI Côte d'Ivoire, 2021" },
            { valeur: 49, dateMesure: '2018-01-01', source: "CEI Côte d'Ivoire, 2018" },
          ],
        },
        {
          id: 'transp_budget',
          labelKey: 'Transparence budgétaire',
          description:
            "Ouverture des documents budgétaires publics selon l'indice de budget ouvert.",
          unit: '%',
          goodDirection: 'up',
          history: [
            { valeur: 62, dateMesure: '2023-01-01', source: 'Open Budget Index, 2023' },
            { valeur: 57, dateMesure: '2021-01-01', source: 'Open Budget Index, 2021' },
            { valeur: 49, dateMesure: '2019-01-01', source: 'Open Budget Index, 2019' },
          ],
        },
        {
          id: 'repr_femmes',
          labelKey: 'Représentation des femmes',
          description:
            "Proportion de femmes parmi les élus des assemblées nationales et locales.",
          unit: '%',
          goodDirection: 'up',
          history: [
            { valeur: 32, dateMesure: '2024-01-01', source: 'ONU Femmes, 2024' },
            { valeur: 27, dateMesure: '2021-01-01', source: 'ONU Femmes, 2021' },
            { valeur: 23, dateMesure: '2018-01-01', source: 'ONU Femmes, 2018' },
          ],
        },
        {
          id: 'decentralisation',
          labelKey: 'Décentralisation',
          description:
            "Autonomie effective des collectivités locales dans la décision publique.",
          unit: '%',
          goodDirection: 'up',
          history: [
            { valeur: 48, dateMesure: '2023-01-01', source: 'Mo Ibrahim, 2023' },
            { valeur: 45, dateMesure: '2021-01-01', source: 'Mo Ibrahim, 2021' },
            { valeur: 44, dateMesure: '2019-01-01', source: 'Mo Ibrahim, 2019' },
          ],
        },
      ],
    },
    {
      id: 'droit',
      sectionTitleKey: 'État de droit & justice',
      colorToken: 'droit',
      indicators: [
        {
          id: 'indep_justice',
          labelKey: 'Indépendance de la justice',
          description:
            "Autonomie des juges vis-à-vis du pouvoir exécutif, mesurée par enquête.",
          unit: '%',
          goodDirection: 'up',
          history: [
            { valeur: 58, dateMesure: '2024-01-01', source: 'World Justice Project, 2024' },
            { valeur: 55, dateMesure: '2022-01-01', source: 'World Justice Project, 2022' },
            { valeur: 52, dateMesure: '2020-01-01', source: 'World Justice Project, 2020' },
          ],
        },
        {
          id: 'acces_droit',
          labelKey: 'Accès au droit',
          description:
            "Capacité des citoyens à faire valoir leurs droits devant la justice.",
          unit: '%',
          goodDirection: 'up',
          history: [
            { valeur: 61, dateMesure: '2023-01-01', source: 'Afrobaromètre, 2023' },
            { valeur: 58, dateMesure: '2021-01-01', source: 'Afrobaromètre, 2021' },
            { valeur: 56, dateMesure: '2019-01-01', source: 'Afrobaromètre, 2019' },
          ],
        },
        {
          id: 'etat_droit',
          labelKey: "Respect de l'état de droit",
          description:
            "Soumission effective des pouvoirs publics à la loi et aux contre-pouvoirs.",
          unit: '%',
          goodDirection: 'up',
          history: [
            { valeur: 55, dateMesure: '2024-01-01', source: 'Freedom House, 2024' },
            { valeur: 53, dateMesure: '2022-01-01', source: 'Freedom House, 2022' },
            { valeur: 50, dateMesure: '2020-01-01', source: 'Freedom House, 2020' },
          ],
        },
        {
          id: 'anti_corruption',
          labelKey: 'Lutte anti-corruption',
          description:
            "Perception du niveau de corruption dans le secteur public (indice inversé).",
          unit: '%',
          goodDirection: 'up',
          history: [
            { valeur: 47, dateMesure: '2023-01-01', source: 'Transparency Int., 2023' },
            { valeur: 44, dateMesure: '2021-01-01', source: 'Transparency Int., 2021' },
            { valeur: 41, dateMesure: '2019-01-01', source: 'Transparency Int., 2019' },
          ],
        },
      ],
    },
    {
      id: 'societe',
      sectionTitleKey: 'Liberté de la presse',
      colorToken: 'genreSociete',
      indicators: [
        {
          id: 'indep_medias',
          labelKey: 'Indépendance des médias',
          description:
            "Liberté des rédactions face aux pressions politiques et économiques.",
          unit: '%',
          goodDirection: 'up',
          history: [
            { valeur: 66, dateMesure: '2024-01-01', source: 'Reporters Sans Frontières, 2024' },
            { valeur: 61, dateMesure: '2022-01-01', source: 'Reporters Sans Frontières, 2022' },
            { valeur: 57, dateMesure: '2020-01-01', source: 'Reporters Sans Frontières, 2020' },
          ],
        },
        {
          id: 'acces_info',
          labelKey: "Accès à l'information",
          description:
            "Facilité d'accès des citoyens aux informations d'intérêt public.",
          unit: '%',
          goodDirection: 'up',
          history: [
            { valeur: 71, dateMesure: '2023-01-01', source: 'UNESCO, 2023' },
            { valeur: 68, dateMesure: '2021-01-01', source: 'UNESCO, 2021' },
            { valeur: 64, dateMesure: '2019-01-01', source: 'UNESCO, 2019' },
          ],
        },
        {
          id: 'pluralisme',
          labelKey: 'Pluralisme',
          description:
            "Diversité des voix et des lignes éditoriales dans le paysage médiatique.",
          unit: '%',
          goodDirection: 'up',
          history: [
            { valeur: 74, dateMesure: '2024-01-01', source: 'Observatoire des Médias, 2024' },
            { valeur: 70, dateMesure: '2022-01-01', source: 'Observatoire des Médias, 2022' },
            { valeur: 67, dateMesure: '2020-01-01', source: 'Observatoire des Médias, 2020' },
          ],
        },
        {
          id: 'protec_sources',
          labelKey: 'Protection des sources',
          description:
            "Garanties légales pour les journalistes protégeant leurs sources.",
          unit: '%',
          goodDirection: 'up',
          history: [
            { valeur: 59, dateMesure: '2023-01-01', source: 'Conseil de la Presse, 2023' },
            { valeur: 52, dateMesure: '2021-01-01', source: 'Conseil de la Presse, 2021' },
            { valeur: 48, dateMesure: '2019-01-01', source: 'Conseil de la Presse, 2019' },
          ],
        },
      ],
    },
    {
      id: 'numerique',
      sectionTitleKey: 'Droits numériques',
      colorToken: 'societeVivant',
      indicators: [
        {
          id: 'protec_donnees',
          labelKey: 'Protection des données',
          description:
            "Cadre légal encadrant la collecte et l'usage des données personnelles.",
          unit: '%',
          goodDirection: 'up',
          history: [
            { valeur: 68, dateMesure: '2024-01-01', source: 'ARTCI, 2024' },
            { valeur: 61, dateMesure: '2022-01-01', source: 'ARTCI, 2022' },
            { valeur: 54, dateMesure: '2020-01-01', source: 'ARTCI, 2020' },
          ],
        },
        {
          id: 'acces_internet',
          labelKey: 'Accès à internet',
          description:
            "Part de la population disposant d'un accès régulier à internet.",
          unit: '%',
          goodDirection: 'up',
          history: [
            { valeur: 45, dateMesure: '2023-01-01', source: 'UIT, 2023' },
            { valeur: 39, dateMesure: '2021-01-01', source: 'UIT, 2021' },
            { valeur: 34, dateMesure: '2019-01-01', source: 'UIT, 2019' },
          ],
        },
        {
          id: 'liberte_ligne',
          labelKey: 'Liberté en ligne',
          description:
            "Absence de censure et de restrictions arbitraires sur internet.",
          unit: '%',
          goodDirection: 'up',
          history: [
            { valeur: 63, dateMesure: '2023-01-01', source: 'Freedom on the Net, 2023' },
            { valeur: 60, dateMesure: '2021-01-01', source: 'Freedom on the Net, 2021' },
            { valeur: 58, dateMesure: '2019-01-01', source: 'Freedom on the Net, 2019' },
          ],
        },
        {
          id: 'inclusion_num',
          labelKey: 'Inclusion numérique',
          description:
            "Réduction des écarts d'accès au numérique entre territoires et genres.",
          unit: '%',
          goodDirection: 'up',
          history: [
            { valeur: 52, dateMesure: '2023-01-01', source: 'GSMA, 2023' },
            { valeur: 47, dateMesure: '2021-01-01', source: 'GSMA, 2021' },
            { valeur: 43, dateMesure: '2019-01-01', source: 'GSMA, 2019' },
          ],
        },
      ],
    },
  ],
};
