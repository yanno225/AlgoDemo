/**
 * Correspondance entre nos indicateurs (référentiel ESATIC) et les codes
 * d'indicateurs de l'API Banque Mondiale (data.worldbank.org).
 * `libelleIndicateur` doit correspondre EXACTEMENT au libellé seedé.
 * Certaines séries sont des approximations (proxy) — l'admin valide de toute
 * façon avant publication.
 */
export interface MappingBanqueMondiale {
  libelleIndicateur: string;
  codeBanqueMondiale: string;
  intitule: string;
}

export const MAPPINGS_BANQUE_MONDIALE: MappingBanqueMondiale[] = [
  { libelleIndicateur: "Taux d'électrification", codeBanqueMondiale: 'EG.ELC.ACCS.ZS', intitule: "Accès à l'électricité (% population)" },
  { libelleIndicateur: 'Taux de chômage chez les jeunes', codeBanqueMondiale: 'SL.UEM.1524.ZS', intitule: 'Chômage des 15-24 ans (%)' },
  { libelleIndicateur: "Taux d'alphabétisation", codeBanqueMondiale: 'SE.ADT.LITR.ZS', intitule: "Alphabétisation des adultes (%)" },
  { libelleIndicateur: 'Espérance de vie', codeBanqueMondiale: 'SP.DYN.LE00.IN', intitule: 'Espérance de vie à la naissance (années)' },
  { libelleIndicateur: "Taux d'accès des jeunes à l'internet haut débit", codeBanqueMondiale: 'IT.NET.USER.ZS', intitule: 'Individus utilisant Internet (% population)' },
  { libelleIndicateur: 'Taux de pauvreté chez les jeunes', codeBanqueMondiale: 'SI.POV.NAHC', intitule: 'Taux de pauvreté (seuil national, %) — proxy' },
  { libelleIndicateur: 'Nombre de professionnels de santé par habitant', codeBanqueMondiale: 'SH.MED.PHYS.ZS', intitule: 'Médecins pour 1 000 habitants' },
  { libelleIndicateur: 'Nombre de décès à la naissance pour 1 000 habitants', codeBanqueMondiale: 'SP.DYN.IMRT.IN', intitule: 'Mortalité infantile pour 1 000 naissances — proxy' },
  { libelleIndicateur: 'Taux de scolarisation des jeunes', codeBanqueMondiale: 'SE.SEC.NENR', intitule: 'Scolarisation nette secondaire (%)' },
  { libelleIndicateur: 'Taux de scolarisation des jeunes filles', codeBanqueMondiale: 'SE.PRM.NENR.FE', intitule: 'Scolarisation nette primaire, filles (%) — proxy' },
  { libelleIndicateur: "Taux d'empreinte carbone", codeBanqueMondiale: 'EN.GHG.CO2.PC.CE', intitule: 'Émissions de CO₂ par habitant (t) — proxy' },
  { libelleIndicateur: 'Taux de reboisement', codeBanqueMondiale: 'AG.LND.FRST.ZS', intitule: 'Superficie forestière (% du territoire) — proxy' },
  { libelleIndicateur: 'Taux de bancarisation des jeunes', codeBanqueMondiale: 'FX.OWN.TOTL.ZS', intitule: 'Détention de compte (% adultes) — proxy' },
  { libelleIndicateur: "Taux d'insertion professionnelle des jeunes", codeBanqueMondiale: 'SL.EMP.1524.SP.ZS', intitule: 'Ratio emploi/population 15-24 ans (%) — proxy' },
];

/** Pays pilote */
export const PAYS_PILOTE = "Côte d'Ivoire";
export const CODE_PAYS_BM = 'CIV';
