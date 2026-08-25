import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  DonneeMesuree,
  IA_SERVICE,
  IaService,
  ReferenceValidee,
  ResultatVerification,
} from './ia-service.interface';

/**
 * Assistant citoyen de vérification des faits (fonctionnalité phare, CDC).
 *
 * Le contexte donné à l'IA est EXACTEMENT le contenu validé de la plateforme :
 * les valeurs d'indicateurs (référentiel des ateliers, sources tracées).
 * L'IA juge l'affirmation par rapport à ces données numérotées et ne peut
 * citer qu'elles — le circuit est le même anti-hallucination que la collecte.
 */
@Injectable()
export class AssistantService {
  constructor(
    @Inject(IA_SERVICE) private readonly iaService: IaService,
    // Lecture croisée référentiel + valeurs : SQL direct, modules découplés.
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async verifier(affirmation: string): Promise<ResultatVerification> {
    const [donnees, references] = await Promise.all([
      this.donneesMesurees(),
      this.referencesValidees(),
    ]);
    return this.iaService.verifierAffirmation({
      affirmation: affirmation.trim().slice(0, 500),
      donnees,
      references,
    });
  }

  /**
   * Les textes déjà validés par l'équipe : synthèses publiées des fiches pays
   * et contenus vérifiés du feed. Deuxième source de vérité de l'assistant —
   * elle grandit toute seule à mesure que la plateforme publie.
   */
  private async referencesValidees(): Promise<ReferenceValidee[]> {
    const [syntheses, contenus] = await Promise.all([
      this.dataSource.query<
        { paysOuZone: string; thematique: string; texte: string }[]
      >(`
        SELECT s."paysOuZone",
               t.libelle AS "thematique",
               COALESCE(s."texteFinal", s."texteGenereIA") AS "texte"
        FROM syntheses s
        JOIN thematiques t ON t.id = s."thematiqueId"
        WHERE s.statut = 'PUBLIEE'
        ORDER BY s."dateGeneration" DESC
        LIMIT 10
      `),
      this.dataSource.query<
        { titre: string; corps: string; source: string | null }[]
      >(`
        SELECT titre, corps, source
        FROM contenus
        WHERE statut_verification = 'VERIFIE' AND est_publie = true
        ORDER BY publie_le DESC
        LIMIT 15
      `),
    ]);

    return [
      ...syntheses.map((s) => ({
        titre: `Synthèse ${s.thematique} — ${s.paysOuZone}`,
        texte: s.texte,
        source: 'Synthèse validée de la fiche pays AlgoDémo',
      })),
      ...contenus.map((c) => ({
        titre: c.titre,
        texte: c.corps,
        source: c.source?.trim() || 'Contenu vérifié du feed AlgoDémo',
      })),
    ];
  }

  /**
   * TOUTES les mesures (historique compris), avec leur source et leur
   * arborescence de référentiel — le « stock de faits » de la plateforme.
   * L'historique est indispensable : sans lui, une affirmation de TENDANCE
   * (« a augmenté », « recule depuis ») serait toujours non vérifiable.
   */
  private async donneesMesurees(): Promise<DonneeMesuree[]> {
    const lignes = await this.dataSource.query<
      {
        thematique: string;
        critere: string;
        indicateur: string;
        paysOuZone: string;
        valeur: number;
        dateMesure: string;
        source: string;
      }[]
    >(`
      SELECT
        t.libelle       AS "thematique",
        c.libelle       AS "critere",
        i.libelle       AS "indicateur",
        v."paysOuZone",
        v.valeur,
        v."dateMesure"::text AS "dateMesure",
        v.source
      FROM valeurs_indicateurs v
      JOIN indicateurs i ON i.id = v."indicateurId"
      JOIN criteres c ON c.id = i."critereId"
      JOIN thematiques t ON t.id = c."thematiqueId"
      ORDER BY i.libelle, v."paysOuZone", v."dateMesure" ASC
    `);

    return lignes.map((ligne) => ({
      thematique: ligne.thematique,
      critere: ligne.critere,
      indicateur: ligne.indicateur,
      paysOuZone: ligne.paysOuZone,
      valeur: Number(ligne.valeur),
      annee: ligne.dateMesure.slice(0, 4),
      source: ligne.source,
    }));
  }
}
