import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { ValeurIndicateur } from '../../fiche-pays/entities/valeur-indicateur.entity';
import { IA_SERVICE, IaService } from '../../ia/ia-service.interface';
import { Indicateur } from '../../referentiel/entities/indicateur.entity';
import { CODE_PAYS_BM, PAYS_PILOTE } from '../config/banque-mondiale-mapping';
import { PropositionValeur } from '../entities/proposition-valeur.entity';
import { StatutProposition } from '../enums/statut-proposition.enum';
import {
  SOURCE_CONNECTORS,
  SourceConnector,
} from './source-connector.interface';

export interface BilanCollecte {
  parSource: { source: string; propositions: number }[];
  propositionsCreees: number;
  doublonsIgnores: number;
}

/** Ligne de triangulation : un indicateur vu par plusieurs sources */
export interface LigneTriangulation {
  indicateur: string;
  critere: string;
  thematique: string;
  /** Pour chaque source : sa valeur la plus récente */
  sources: {
    source: string;
    valeur: number;
    annee: string;
    statut: StatutProposition;
    propositionId: string;
  }[];
  /** true si ≥2 sources et écart max/min ≤ 10 % de la moyenne */
  concordance: boolean;
  /** Nombre de sources distinctes — niveau de fiabilité (croisement de sources) */
  niveauVerification: number;
}

@Injectable()
export class CollecteService {
  private readonly logger = new Logger(CollecteService.name);

  constructor(
    @InjectRepository(PropositionValeur)
    private readonly propositionRepo: Repository<PropositionValeur>,
    @InjectRepository(Indicateur)
    private readonly indicateurRepo: Repository<Indicateur>,
    @InjectRepository(ValeurIndicateur)
    private readonly valeurRepo: Repository<ValeurIndicateur>,
    @Inject(SOURCE_CONNECTORS)
    private readonly connecteurs: SourceConnector[],
    @Inject(IA_SERVICE)
    private readonly iaService: IaService,
  ) {}

  /**
   * JOB PLANIFIÉ — collecte continue, chaque semaine, sans intervention.
   * Interroge TOUTES les sources branchées (aucun token IA : simple HTTP).
   */
  @Cron(CronExpression.EVERY_WEEK, { name: 'collecte-hebdomadaire' })
  async collectePlanifiee(): Promise<void> {
    this.logger.log('Collecte planifiée : démarrage…');
    const bilan = await this.collecterToutesSources();
    this.logger.log(
      `Collecte planifiée terminée : ${bilan.propositionsCreees} proposition(s) créée(s).`,
    );
  }

  /** Interroge toutes les sources et crée les propositions EN_ATTENTE. Idempotent. */
  async collecterToutesSources(): Promise<BilanCollecte> {
    const indicateurs = await this.indicateurRepo.find({
      select: { id: true, libelle: true },
    });
    const refs = indicateurs.map((i) => ({ id: i.id, libelle: i.libelle }));

    const bilan: BilanCollecte = {
      parSource: [],
      propositionsCreees: 0,
      doublonsIgnores: 0,
    };

    for (const connecteur of this.connecteurs) {
      let creees = 0;
      const valeurs = await connecteur.collecter(refs, CODE_PAYS_BM);
      for (const v of valeurs) {
        const cree = await this.creerProposition({
          indicateur: { id: v.indicateurId } as Indicateur,
          valeur: v.valeur,
          dateMesure: v.dateMesure,
          paysOuZone: PAYS_PILOTE,
          source: v.source,
        });
        cree ? (creees++, bilan.propositionsCreees++) : bilan.doublonsIgnores++;
      }
      bilan.parSource.push({ source: connecteur.nom, propositions: creees });
    }
    return bilan;
  }

  /**
   * Ingestion d'un texte (article/rapport) → l'IA extrait les valeurs
   * rattachées aux indicateurs connus → propositions EN_ATTENTE.
   */
  async ingererTexte(
    texteBrut: string,
    sourceLabel: string,
    paysOuZone = PAYS_PILOTE,
  ): Promise<{ propositionsCreees: number; doublonsIgnores: number }> {
    const indicateurs = await this.indicateurRepo.find({
      select: { id: true, libelle: true },
    });
    const propositions = await this.iaService.extraireValeurs(
      texteBrut,
      indicateurs.map((i) => ({ id: i.id, libelle: i.libelle })),
    );
    let creees = 0,
      doublons = 0;
    for (const p of propositions) {
      if (!indicateurs.some((i) => i.id === p.indicateurId)) continue;
      const cree = await this.creerProposition({
        indicateur: { id: p.indicateurId } as Indicateur,
        valeur: p.valeur,
        dateMesure: p.dateMesure,
        paysOuZone,
        source: p.source || sourceLabel,
      });
      cree ? creees++ : doublons++;
    }
    return { propositionsCreees: creees, doublonsIgnores: doublons };
  }

  private async creerProposition(donnees: {
    indicateur: Indicateur;
    valeur: number;
    dateMesure: string;
    paysOuZone: string;
    source: string;
  }): Promise<boolean> {
    const existe = await this.propositionRepo.findOne({
      where: {
        indicateur: { id: donnees.indicateur.id },
        paysOuZone: donnees.paysOuZone,
        dateMesure: donnees.dateMesure,
        source: donnees.source,
      },
    });
    if (existe) return false;
    await this.propositionRepo.save(this.propositionRepo.create(donnees));
    return true;
  }

  findPropositions(
    statut?: StatutProposition,
    pays?: string,
  ): Promise<PropositionValeur[]> {
    return this.propositionRepo.find({
      where: {
        ...(statut ? { statut } : {}),
        ...(pays ? { paysOuZone: ILike(pays) } : {}),
      },
      relations: { indicateur: { critere: { thematique: true } } },
      order: { collecteLe: 'DESC' },
    });
  }

  /**
   * Vue TRIANGULATION : pour chaque indicateur + année, regroupe ce que disent
   * les différentes sources. La concordance de plusieurs sources = niveau de
   * vérification élevé (CDC §7).
   */
  async triangulation(pays = PAYS_PILOTE): Promise<LigneTriangulation[]> {
    const propositions = await this.propositionRepo.find({
      where: { paysOuZone: ILike(pays) },
      relations: { indicateur: { critere: { thematique: true } } },
    });

    // Regroupement par indicateur (toutes années confondues)
    const groupes = new Map<string, PropositionValeur[]>();
    for (const p of propositions) {
      const liste = groupes.get(p.indicateur.id) ?? [];
      liste.push(p);
      groupes.set(p.indicateur.id, liste);
    }

    const lignes: LigneTriangulation[] = [];
    for (const liste of groupes.values()) {
      const ref = liste[0];

      // Pour CHAQUE source distincte, la valeur la plus récente
      // (propositions déjà triées par date décroissante).
      const parSource = new Map<string, PropositionValeur>();
      for (const p of liste) {
        const cleSource = p.source.split(' — ')[0].trim();
        if (!parSource.has(cleSource)) parSource.set(cleSource, p);
      }
      const sources = [...parSource.values()].map((p) => ({
        source: p.source,
        valeur: p.valeur,
        annee: p.dateMesure.slice(0, 4),
        statut: p.statut,
        propositionId: p.id,
      }));

      const valeurs = sources.map((s) => s.valeur);
      const moyenne = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
      const ecart = Math.max(...valeurs) - Math.min(...valeurs);
      const concordance =
        sources.length >= 2 && moyenne !== 0 && ecart / Math.abs(moyenne) <= 0.1;

      lignes.push({
        indicateur: ref.indicateur.libelle,
        critere: ref.indicateur.critere.libelle,
        thematique: ref.indicateur.critere.thematique.libelle,
        sources,
        concordance,
        niveauVerification: sources.length,
      });
    }
    // Les indicateurs confirmés par le plus de sources d'abord
    return lignes.sort((a, b) => b.niveauVerification - a.niveauVerification);
  }

  /**
   * Écran admin d'un indicateur : TOUTES les valeurs collectées (par source)
   * + une reformulation rédigée par l'IA (brouillon à valider). L'appel IA
   * n'a lieu QUE sur demande admin (pas en continu) → très peu de tokens.
   */
  async analyserIndicateur(
    indicateurId: string,
    pays = PAYS_PILOTE,
  ): Promise<{
    indicateur: string;
    critere: string;
    thematique: string;
    sources: { source: string; valeur: number; annee: string; propositionId: string }[];
    reformulationIA: string;
  }> {
    const indicateur = await this.indicateurRepo.findOne({
      where: { id: indicateurId },
      relations: { critere: { thematique: true } },
    });
    if (!indicateur) {
      throw new NotFoundException(`Indicateur ${indicateurId} introuvable`);
    }

    const propositions = await this.propositionRepo.find({
      where: { indicateur: { id: indicateurId }, paysOuZone: ILike(pays) },
      order: { dateMesure: 'DESC' },
    });

    // Valeur la plus récente par source distincte
    const parSource = new Map<string, PropositionValeur>();
    for (const p of propositions) {
      const cle = p.source.split(' — ')[0].trim();
      if (!parSource.has(cle)) parSource.set(cle, p);
    }
    const sources = [...parSource.values()].map((p) => ({
      source: p.source,
      valeur: p.valeur,
      annee: p.dateMesure.slice(0, 4),
      propositionId: p.id,
    }));

    const reformulationIA =
      sources.length > 0
        ? await this.iaService.reformulerIndicateur({
            indicateur: indicateur.libelle,
            critere: indicateur.critere.libelle,
            thematique: indicateur.critere.thematique.libelle,
            paysOuZone: pays,
            sources: sources.map((s) => ({
              source: s.source,
              valeur: s.valeur,
              annee: s.annee,
            })),
          })
        : 'Aucune donnée collectée pour cet indicateur.';

    return {
      indicateur: indicateur.libelle,
      critere: indicateur.critere.libelle,
      thematique: indicateur.critere.thematique.libelle,
      sources,
      reformulationIA,
    };
  }

  async valider(id: string): Promise<ValeurIndicateur> {
    const proposition = await this.propositionRepo.findOne({
      where: { id },
      relations: { indicateur: true },
    });
    if (!proposition) {
      throw new NotFoundException(`Proposition ${id} introuvable`);
    }
    let valeur = await this.valeurRepo.findOne({
      where: {
        indicateur: { id: proposition.indicateur.id },
        paysOuZone: proposition.paysOuZone,
        dateMesure: proposition.dateMesure,
      },
    });
    if (valeur) {
      valeur.valeur = proposition.valeur;
      valeur.source = proposition.source;
    } else {
      valeur = this.valeurRepo.create({
        indicateur: proposition.indicateur,
        valeur: proposition.valeur,
        dateMesure: proposition.dateMesure,
        paysOuZone: proposition.paysOuZone,
        source: proposition.source,
      });
    }
    const sauvegarde = await this.valeurRepo.save(valeur);
    proposition.statut = StatutProposition.VALIDEE;
    await this.propositionRepo.save(proposition);
    return sauvegarde;
  }

  async rejeter(id: string): Promise<PropositionValeur> {
    const proposition = await this.propositionRepo.findOneBy({ id });
    if (!proposition) {
      throw new NotFoundException(`Proposition ${id} introuvable`);
    }
    proposition.statut = StatutProposition.REJETEE;
    return this.propositionRepo.save(proposition);
  }
}
