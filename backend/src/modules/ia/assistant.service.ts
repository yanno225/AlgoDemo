import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
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
    const [donnees, references, domainesAutorises] = await Promise.all([
      this.donneesMesurees(),
      this.referencesValidees(),
      this.domainesListeBlanche(),
    ]);
    return this.iaService.verifierAffirmation({
      affirmation: affirmation.trim().slice(0, 500),
      donnees,
      references,
      domainesAutorises,
    });
  }

  /**
   * Vérification à partir d'un FICHIER citoyen (image ou PDF) : l'IA en
   * extrait d'abord fidèlement les affirmations factuelles, puis ce texte
   * repart dans le circuit standard (données de la plateforme + recherche
   * sur liste blanche). `affirmationAnalysee` montre au citoyen ce qui a
   * réellement été soumis au verdict — transparence totale.
   */
  async verifierFichier(
    fichier: { buffer: Buffer; mimetype: string },
    question?: string,
  ): Promise<ResultatVerification & { affirmationAnalysee: string | null }> {
    if (!this.iaService.extraireAffirmationsFichier) {
      throw new ServiceUnavailableException(
        "L'analyse de fichiers n'est pas disponible avec le fournisseur IA configuré",
      );
    }

    const extraites = await this.iaService.extraireAffirmationsFichier(
      {
        data: fichier.buffer.toString('base64'),
        mediaType: fichier.mimetype,
      },
      question,
    );

    if (!extraites || extraites.includes('AUCUNE_AFFIRMATION')) {
      return {
        verdict: 'NON_VERIFIABLE',
        explication:
          "Aucune affirmation factuelle vérifiable n'a été trouvée dans ce fichier — il ne contient ni chiffre, ni fait précis à confronter à nos sources.",
        elements: [],
        references: [],
        sourcesWeb: [],
        eclairage: null,
        affirmationAnalysee: null,
      };
    }

    const resultat = await this.verifier(extraites);
    return { ...resultat, affirmationAnalysee: extraites };
  }

  /**
   * Les domaines de la liste blanche des sources — le périmètre exact de la
   * recherche web de l'assistant. Une source désactivée sort du périmètre
   * immédiatement.
   */
  private async domainesListeBlanche(): Promise<string[]> {
    const lignes = await this.dataSource.query<{ domaine: string }[]>(
      `SELECT domaine FROM sources_autorisees WHERE active = true AND domaine IS NOT NULL`,
    );
    return lignes.map((l) => l.domaine);
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
