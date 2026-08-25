import { apiClient } from './client';
import { THEMATICS } from '../../constants/thematics';
import type {
  CountryDomain,
  CountryIndicator,
  CountryProfile,
  IndicatorValue,
} from '../../constants/countryProfile';

/**
 * Fiche pays — branchée sur GET /fiche-pays/{pays}.
 *
 * Le backend renvoie le squelette complet du référentiel (86 indicateurs des
 * ateliers) avec les mesures réelles du pays et les synthèses validées.
 * Le mapping ne montre que ce qui est MESURÉ : une jauge sans donnée réelle
 * n'existe pas — c'est la règle de la plateforme.
 */

interface BackendValeur {
  valeur: number;
  dateMesure: string;
  source: string;
}

interface BackendFiche {
  pays: string;
  nombreValeurs: number;
  thematiques: {
    id: string;
    libelle: string;
    synthese: { texte: string | null; dateValidation: string | null } | null;
    criteres: {
      id: string;
      libelle: string;
      indicateurs: { id: string; libelle: string; valeurs: BackendValeur[] }[];
    }[];
  }[];
}

const normaliser = (texte: string) =>
  texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

/** Jeton de couleur FID de la thématique, retrouvé par libellé normalisé. */
function colorTokenDe(libelle: string): CountryDomain['colorToken'] {
  const config = THEMATICS.find(
    (thematic) => normaliser(thematic.label) === normaliser(libelle)
  );
  return (config?.colorToken ?? 'politique') as CountryDomain['colorToken'];
}

/** Unité d'affichage, déduite du libellé de l'indicateur des ateliers. */
function uniteDe(libelle: string): string {
  const cle = normaliser(libelle);
  if (cle.includes('esperance de vie')) return ' ans';
  if (cle.includes('empreinte carbone')) return ' t';
  if (cle.includes('pollution')) return ' µg/m³';
  if (cle.includes('professionnels de sante')) return ' ‰';
  if (cle.includes('deces a la naissance')) return ' ‰';
  if (cle.startsWith('taux') || cle.startsWith('proportion') || cle.includes('parite'))
    return '%';
  if (cle.startsWith('indice')) return '';
  return '';
}

/** Sens de lecture : `down` quand une baisse est une bonne nouvelle. */
function sensDe(libelle: string): 'up' | 'down' {
  const cle = normaliser(libelle);
  const enBaisse = [
    'chomage', 'deces', 'mortalite', 'pollution', 'empreinte', 'feminicide',
    'vbg', 'violence', 'suicide', 'delinquance', 'criminalite', 'echec',
    'decrochage', 'emigration', 'incarcer', 'pauvrete', 'cout', 'prix',
    'bidonville', 'travail illegal', 'bulletins nuls', 'fraude',
  ];
  return enBaisse.some((mot) => cle.includes(mot)) ? 'down' : 'up';
}

/** « Banque mondiale — Espérance de vie… [SP.DYN…] » → « Banque mondiale » */
const organisme = (source: string) => source.split(' — ')[0].split(',')[0].trim();

const formatFr = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');

export async function getCountryProfile(pays: string): Promise<CountryProfile> {
  const { data } = await apiClient.get<BackendFiche>(
    `/fiche-pays/${encodeURIComponent(pays)}`
  );

  let derniereMesure = '';
  const domains: CountryDomain[] = data.thematiques.map((thematique) => {
    const indicators: CountryIndicator[] = [];
    const sourcesDomaine = new Set<string>();

    for (const critere of thematique.criteres) {
      for (const indicateur of critere.indicateurs) {
        if (indicateur.valeurs.length === 0) continue; // jamais de jauge sans mesure
        const history: IndicatorValue[] = indicateur.valeurs;
        history.forEach((v) => {
          sourcesDomaine.add(organisme(v.source));
          if (v.dateMesure > derniereMesure) derniereMesure = v.dateMesure;
        });
        indicators.push({
          id: indicateur.id,
          labelKey: indicateur.libelle,
          description: `Critère « ${critere.libelle} », thématique « ${thematique.libelle} » — référentiel des ateliers AlgoDémo.`,
          unit: uniteDe(indicateur.libelle),
          goodDirection: sensDe(indicateur.libelle),
          history,
        });
      }
    }

    return {
      id: thematique.id,
      sectionTitleKey: thematique.libelle,
      colorToken: colorTokenDe(thematique.libelle),
      synthesis: thematique.synthese?.texte ?? null,
      sourceCount: sourcesDomaine.size,
      indicators,
    };
  });

  // Le « saviez-vous » est CALCULÉ : la plus belle progression réelle.
  let didYouKnow: string | null = null;
  let meilleurGain = 0;
  for (const domain of domains) {
    for (const indicator of domain.indicators) {
      if (indicator.unit !== '%' || indicator.history.length < 2) continue;
      const recent = indicator.history[0];
      const ancien = indicator.history[indicator.history.length - 1];
      const gain =
        (recent.valeur - ancien.valeur) * (indicator.goodDirection === 'up' ? 1 : -1);
      if (gain > meilleurGain) {
        meilleurGain = gain;
        const verbe =
          recent.valeur >= ancien.valeur ? 'est passé de' : 'a reculé de';
        didYouKnow =
          `${indicator.labelKey} ${verbe} ${formatFr(ancien.valeur)} % en ${ancien.dateMesure.slice(0, 4)} ` +
          `à ${formatFr(recent.valeur)} % en ${recent.dateMesure.slice(0, 4)} (${organisme(recent.source)}).`;
      }
    }
  }

  return {
    name: data.pays,
    flag: '🇨🇮',
    updatedAt: derniereMesure
      ? new Date(derniereMesure).toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric',
        })
      : '—',
    didYouKnow,
    domains,
  };
}
