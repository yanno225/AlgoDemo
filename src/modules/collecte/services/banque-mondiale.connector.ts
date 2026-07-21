import { Injectable, Logger } from '@nestjs/common';
import {
  MAPPINGS_BANQUE_MONDIALE,
} from '../config/banque-mondiale-mapping';
import {
  IndicateurRef,
  SourceConnector,
  ValeurCollectee,
} from './source-connector.interface';

/**
 * Source : API publique et gratuite de la Banque Mondiale (api.worldbank.org).
 * Données ouvertes, JSON, aucune clé. Aucune IA, aucun token — simple HTTP.
 */
@Injectable()
export class BanqueMondialeConnector implements SourceConnector {
  readonly nom = 'Banque Mondiale';
  private readonly logger = new Logger(BanqueMondialeConnector.name);

  async collecter(
    indicateurs: IndicateurRef[],
    codePays: string,
  ): Promise<ValeurCollectee[]> {
    const parLibelle = new Map(indicateurs.map((i) => [i.libelle, i.id]));
    const resultats: ValeurCollectee[] = [];

    for (const mapping of MAPPINGS_BANQUE_MONDIALE) {
      const indicateurId = parLibelle.get(mapping.libelleIndicateur);
      if (!indicateurId) continue;

      const serie = await this.recupererSerie(
        codePays,
        mapping.codeBanqueMondiale,
      );
      for (const { annee, valeur } of serie) {
        resultats.push({
          indicateurId,
          valeur,
          dateMesure: `${annee}-01-01`,
          source: `Banque Mondiale — ${mapping.intitule} (${mapping.codeBanqueMondiale})`,
        });
      }
    }
    return resultats;
  }

  private async recupererSerie(
    codePays: string,
    codeIndicateur: string,
    nombre = 5,
  ): Promise<{ annee: string; valeur: number }[]> {
    // mrnev = N dernières valeurs renseignées ; per_page large pour ne rien tronquer
    const url =
      `https://api.worldbank.org/v2/country/${codePays}/indicator/${codeIndicateur}` +
      `?format=json&per_page=1000&mrnev=${nombre}`;
    try {
      const reponse = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (!reponse.ok) return [];
      const data = (await reponse.json()) as unknown;
      if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1])) {
        return [];
      }
      return (data[1] as { date?: string; value?: number | null }[])
        .filter((p) => p.value !== null && p.value !== undefined && p.date)
        .map((p) => ({ annee: p.date!, valeur: Number(p.value) }));
    } catch (e) {
      this.logger.warn(
        `Banque Mondiale injoignable (${codeIndicateur}) : ${e instanceof Error ? e.message : String(e)}`,
      );
      return [];
    }
  }
}
