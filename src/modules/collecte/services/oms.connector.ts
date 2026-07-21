import { Injectable, Logger } from '@nestjs/common';
import {
  IndicateurRef,
  SourceConnector,
  ValeurCollectee,
} from './source-connector.interface';

/** Correspondance indicateur ↔ code OMS (Global Health Observatory) */
interface MappingOms {
  libelleIndicateur: string;
  codeOms: string;
  intitule: string;
  /** Filtre de désagrégation (ex. BTSX = les deux sexes) si nécessaire */
  dim1?: string;
}

const MAPPINGS_OMS: MappingOms[] = [
  {
    libelleIndicateur: 'Espérance de vie',
    codeOms: 'WHOSIS_000001',
    intitule: 'Espérance de vie à la naissance (années)',
    dim1: 'BTSX',
  },
  {
    libelleIndicateur: 'Nombre de professionnels de santé par habitant',
    codeOms: 'HWF_0001',
    intitule: 'Médecins pour 10 000 habitants',
  },
  {
    libelleIndicateur: 'Taux de suicide des populations en zones urbaines',
    codeOms: 'MH_12',
    intitule: 'Taux de mortalité par suicide (pour 100 000) — proxy',
    dim1: 'BTSX',
  },
];

/**
 * Source : Global Health Observatory de l'OMS (ghoapi.azureedge.net).
 * API OData publique et gratuite, JSON, aucune clé. Recoupe la Banque Mondiale
 * sur certains indicateurs (espérance de vie…) → alimente la triangulation.
 */
@Injectable()
export class OmsConnector implements SourceConnector {
  readonly nom = 'OMS (GHO)';
  private readonly logger = new Logger(OmsConnector.name);

  async collecter(
    indicateurs: IndicateurRef[],
    codePays: string,
  ): Promise<ValeurCollectee[]> {
    const parLibelle = new Map(indicateurs.map((i) => [i.libelle, i.id]));
    const resultats: ValeurCollectee[] = [];

    for (const mapping of MAPPINGS_OMS) {
      const indicateurId = parLibelle.get(mapping.libelleIndicateur);
      if (!indicateurId) continue;

      const mesures = await this.recuperer(codePays, mapping);
      // On ne garde que les 5 années les plus récentes
      for (const { annee, valeur } of mesures.slice(0, 5)) {
        resultats.push({
          indicateurId,
          valeur,
          dateMesure: `${annee}-01-01`,
          source: `OMS (GHO) — ${mapping.intitule} (${mapping.codeOms})`,
        });
      }
    }
    return resultats;
  }

  private async recuperer(
    codePays: string,
    mapping: MappingOms,
  ): Promise<{ annee: number; valeur: number }[]> {
    const url =
      `https://ghoapi.azureedge.net/api/${mapping.codeOms}` +
      `?$filter=SpatialDim eq '${codePays}'`;
    try {
      const reponse = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (!reponse.ok) return [];
      const data = (await reponse.json()) as {
        value?: {
          TimeDim?: number;
          Dim1?: string;
          NumericValue?: number | null;
        }[];
      };
      // Le code « les deux sexes » varie selon les séries (BTSX ou SEX_BTSX)
      const dimsAcceptes = mapping.dim1
        ? [mapping.dim1, `SEX_${mapping.dim1}`]
        : null;
      return (data.value ?? [])
        .filter(
          (p) =>
            p.NumericValue !== null &&
            p.NumericValue !== undefined &&
            p.TimeDim &&
            (!dimsAcceptes || dimsAcceptes.includes(p.Dim1 ?? '')),
        )
        .map((p) => ({ annee: p.TimeDim!, valeur: Number(p.NumericValue) }))
        .sort((a, b) => b.annee - a.annee);
    } catch (e) {
      this.logger.warn(
        `OMS injoignable (${mapping.codeOms}) : ${e instanceof Error ? e.message : String(e)}`,
      );
      return [];
    }
  }
}
