/**
 * Fiche pays — indicateurs de santé démocratique.
 *
 * Pilote : Côte d'Ivoire. L'extension aux 19 pays du programme est prévue par
 * la feuille de route ; la structure ci-dessous est déjà multi-pays pour
 * l'accueillir sans refonte.
 *
 * ⚠️ Données illustratives. TODO(backend) : remplacer par
 * GET /countries/:code/profile. Aucune valeur ne doit être présentée comme
 * officielle tant que la source réelle n'est pas branchée.
 */

export type DomainId = 'politique' | 'droit' | 'societe' | 'numerique';

export interface CountryIndicator {
  id: string;
  /** Libellé court de l'indicateur. */
  labelKey: string;
  /** Valeur de 0 à 100. */
  value: number;
  /** Organisme et année de la mesure. */
  source: string;
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
        { id: 'part_elec', labelKey: 'Participation électorale', value: 54, source: 'CEI Côte d\'Ivoire, 2023' },
        { id: 'transp_budget', labelKey: 'Transparence budgétaire', value: 62, source: 'Open Budget Index, 2023' },
        { id: 'repr_femmes', labelKey: 'Représentation des femmes', value: 32, source: 'ONU Femmes, 2024' },
        { id: 'decentralisation', labelKey: 'Décentralisation', value: 48, source: 'Mo Ibrahim, 2023' },
      ],
    },
    {
      id: 'droit',
      sectionTitleKey: 'État de droit & justice',
      colorToken: 'droit',
      indicators: [
        { id: 'indep_justice', labelKey: 'Indépendance de la justice', value: 58, source: 'World Justice Project, 2024' },
        { id: 'acces_droit', labelKey: 'Accès au droit', value: 61, source: 'Afrobaromètre, 2023' },
        { id: 'etat_droit', labelKey: 'Respect de l\'état de droit', value: 55, source: 'Freedom House, 2024' },
        { id: 'anti_corruption', labelKey: 'Lutte anti-corruption', value: 47, source: 'Transparency Int., 2023' },
      ],
    },
    {
      id: 'societe',
      sectionTitleKey: 'Liberté de la presse',
      colorToken: 'genreSociete',
      indicators: [
        { id: 'indep_medias', labelKey: 'Indépendance des médias', value: 66, source: 'Reporters Sans Frontières, 2024' },
        { id: 'acces_info', labelKey: 'Accès à l\'information', value: 71, source: 'UNESCO, 2023' },
        { id: 'pluralisme', labelKey: 'Pluralisme', value: 74, source: 'Observatoire des Médias, 2024' },
        { id: 'protec_sources', labelKey: 'Protection des sources', value: 59, source: 'Conseil de la Presse, 2023' },
      ],
    },
    {
      id: 'numerique',
      sectionTitleKey: 'Droits numériques',
      colorToken: 'societeVivant',
      indicators: [
        { id: 'protec_donnees', labelKey: 'Protection des données', value: 68, source: 'ARTCI, 2024' },
        { id: 'acces_internet', labelKey: 'Accès à internet', value: 45, source: 'UIT, 2023' },
        { id: 'liberte_ligne', labelKey: 'Liberté en ligne', value: 63, source: 'Freedom on the Net, 2023' },
        { id: 'inclusion_num', labelKey: 'Inclusion numérique', value: 52, source: 'GSMA, 2023' },
      ],
    },
  ],
};
