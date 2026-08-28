import { Injectable, Logger } from '@nestjs/common';
import {
  IndicateurRef,
  SourceConnector,
  ValeurCollectee,
} from './source-connector.interface';

/**
 * Source : Reporters sans frontières (rsf.org) — Classement mondial de la
 * liberté de la presse, publié chaque année. Pas d'API publique : on lit la
 * page pays officielle et on en extrait le score courant (« Score : 66,27 »)
 * et l'année d'édition (« Classement 2026 »). Extraction tolérante à
 * l'échec : si la page change de forme, la collecte RSF rend simplement
 * zéro valeur — jamais une valeur douteuse.
 */
@Injectable()
export class RsfConnector implements SourceConnector {
  readonly nom = 'RSF';
  private readonly logger = new Logger(RsfConnector.name);

  /** Libellé EXACT de l'indicateur du référentiel alimenté par RSF. */
  private static readonly LIBELLE_INDICATEUR =
    'Indice de liberté de la presse (score RSF sur 100)';

  /** Pages pays RSF par code ISO3 — extensible aux 19 pays. */
  private static readonly PAGES_PAYS: Record<string, string> = {
    CIV: 'https://rsf.org/fr/pays/c%C3%B4te-divoire',
  };

  async collecter(
    indicateurs: IndicateurRef[],
    codePays: string,
  ): Promise<ValeurCollectee[]> {
    const indicateur = indicateurs.find(
      (i) => i.libelle === RsfConnector.LIBELLE_INDICATEUR,
    );
    const url = RsfConnector.PAGES_PAYS[codePays];
    if (!indicateur || !url) return [];

    try {
      const reponse = await fetch(url, {
        headers: { Accept: 'text/html' },
        signal: AbortSignal.timeout(20000),
      });
      if (!reponse.ok) return [];
      const html = await reponse.text();

      // Score courant : « score current">Score : 66,27 »
      const scoreBrut = /score current"[^>]*>\s*Score\s*:\s*(\d{1,3}[.,]\d{1,2})/.exec(
        html,
      )?.[1];
      // Année d'édition : la plus récente parmi « Classement 20XX »
      const annees = [...html.matchAll(/Classement\s+(20\d{2})/g)]
        .map((m) => Number(m[1]))
        .filter((a) => a >= 2000 && a <= new Date().getFullYear() + 1);
      const annee = annees.length ? Math.max(...annees) : null;

      if (!scoreBrut || !annee) {
        this.logger.warn(
          `Page RSF illisible pour ${codePays} — score ou année introuvables (mise en page modifiée ?)`,
        );
        return [];
      }

      const valeur = Number(scoreBrut.replace(',', '.'));
      if (!Number.isFinite(valeur) || valeur < 0 || valeur > 100) return [];

      return [
        {
          indicateurId: indicateur.id,
          valeur,
          dateMesure: `${annee}-01-01`,
          source: `RSF — Classement mondial de la liberté de la presse ${annee} (rsf.org)`,
        },
      ];
    } catch (e) {
      this.logger.warn(
        `RSF injoignable : ${e instanceof Error ? e.message : String(e)}`,
      );
      return [];
    }
  }
}
