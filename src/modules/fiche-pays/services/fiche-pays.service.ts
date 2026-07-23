import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { IA_SERVICE, IaService } from '../../ia/ia-service.interface';
import { Indicateur } from '../../referentiel/entities/indicateur.entity';
import { Thematique } from '../../referentiel/entities/thematique.entity';
import { ArticleIndicateur } from '../entities/article-indicateur.entity';
import { ValeurIndicateur } from '../entities/valeur-indicateur.entity';
import { SynthesesService } from './syntheses.service';

/** Une mesure datée, exposée dans la fiche-pays */
export interface ValeurExposee {
  valeur: number;
  dateMesure: string;
  source: string;
}

/**
 * Assemble la Fiche-pays : le squelette du Référentiel
 * (thématiques › critères › indicateurs) + les valeurs mesurées du pays,
 * triées de la plus récente à la plus ancienne (séries temporelles).
 *
 * Chaque thématique inclut sa synthèse rédigée (IA + validation admin)
 * lorsqu'elle existe. Étape suivante : lecture audio TTS (service du Dev A).
 */
@Injectable()
export class FichePaysService {
  constructor(
    @InjectRepository(Thematique)
    private readonly thematiqueRepo: Repository<Thematique>,
    @InjectRepository(ValeurIndicateur)
    private readonly valeurRepo: Repository<ValeurIndicateur>,
    @InjectRepository(Indicateur)
    private readonly indicateurRepo: Repository<Indicateur>,
    @InjectRepository(ArticleIndicateur)
    private readonly articleRepo: Repository<ArticleIndicateur>,
    @Inject(IA_SERVICE)
    private readonly iaService: IaService,
    private readonly synthesesService: SynthesesService,
  ) {}

  /**
   * Détail d'un indicateur pour un pays : TOUTES les valeurs collectées (avec
   * leurs sources) + un article rédigé par l'IA. Consommé à la fois par l'app
   * mobile (le citoyen ouvre l'indicateur) et par le back-office admin.
   * L'article est mis en cache (généré une fois par indicateur/pays).
   */
  async getIndicateurDetail(indicateurId: string, pays = "Côte d'Ivoire") {
    const indicateur = await this.indicateurRepo.findOne({
      where: { id: indicateurId },
      relations: { critere: { thematique: true } },
    });
    if (!indicateur) {
      throw new NotFoundException(`Indicateur ${indicateurId} introuvable`);
    }

    // Toutes les mesures du pays, de la plus récente à la plus ancienne
    const valeurs = await this.valeurRepo.find({
      where: { indicateur: { id: indicateurId }, paysOuZone: ILike(pays) },
      order: { dateMesure: 'DESC' },
    });

    // Sources distinctes (triangulation) : valeur la plus récente par source
    const parSource = new Map<string, ValeurIndicateur>();
    for (const v of valeurs) {
      const cle = v.source.split(' — ')[0].trim();
      if (!parSource.has(cle)) parSource.set(cle, v);
    }
    const sources = [...parSource.values()].map((v) => ({
      source: v.source,
      valeur: v.valeur,
      annee: v.dateMesure.slice(0, 4),
    }));

    // Article (cache) : généré une fois puis réutilisé
    let article = await this.articleRepo.findOne({
      where: { indicateurId, paysOuZone: pays },
    });
    if (!article && sources.length > 0) {
      const texte = await this.iaService.reformulerIndicateur({
        indicateur: indicateur.libelle,
        critere: indicateur.critere.libelle,
        thematique: indicateur.critere.thematique.libelle,
        paysOuZone: pays,
        sources: sources.map((s) => ({
          source: s.source,
          valeur: s.valeur,
          annee: s.annee,
        })),
      });
      article = await this.articleRepo.save(
        this.articleRepo.create({ indicateurId, paysOuZone: pays, texte }),
      );
    }

    return {
      indicateur: indicateur.libelle,
      critere: indicateur.critere.libelle,
      thematique: indicateur.critere.thematique.libelle,
      pays,
      // historique complet (pour le graphique d'évolution)
      valeurs: valeurs.map((v) => ({
        valeur: v.valeur,
        dateMesure: v.dateMesure,
        source: v.source,
      })),
      // sources croisées (triangulation)
      sources,
      article: article?.texte ?? null,
    };
  }

  async getFichePays(pays: string) {
    // 1. Le squelette complet du référentiel
    const thematiques = await this.thematiqueRepo.find({
      relations: { criteres: { indicateurs: true } },
      order: {
        libelle: 'ASC',
        criteres: { libelle: 'ASC', indicateurs: { libelle: 'ASC' } },
      },
    });

    // 2. Toutes les valeurs du pays (recherche insensible à la casse)
    const valeurs = await this.valeurRepo.find({
      where: { paysOuZone: ILike(pays) },
      relations: { indicateur: true },
      order: { dateMesure: 'DESC' },
    });

    // 3. Les synthèses validées par l'admin (les seules visibles du public)
    const syntheses = await this.synthesesService.publieesParThematique(pays);

    // 4. Regroupement des valeurs par indicateur
    const parIndicateur = new Map<string, ValeurExposee[]>();
    for (const v of valeurs) {
      const liste = parIndicateur.get(v.indicateur.id) ?? [];
      liste.push({
        valeur: v.valeur,
        dateMesure: v.dateMesure,
        source: v.source,
      });
      parIndicateur.set(v.indicateur.id, liste);
    }

    // 5. Assemblage final : arbre + synthèses + valeurs (les indicateurs sans
    //    valeur restent visibles, avec une liste vide — le squelette est complet)
    return {
      pays: valeurs[0]?.paysOuZone ?? pays,
      nombreValeurs: valeurs.length,
      thematiques: thematiques.map((t) => ({
        id: t.id,
        libelle: t.libelle,
        synthese: syntheses.has(t.id)
          ? {
              texte: syntheses.get(t.id)!.texteFinal,
              dateValidation: syntheses.get(t.id)!.dateValidation,
            }
          : null,
        criteres: t.criteres.map((c) => ({
          id: c.id,
          libelle: c.libelle,
          indicateurs: c.indicateurs.map((i) => ({
            id: i.id,
            libelle: i.libelle,
            valeurs: parIndicateur.get(i.id) ?? [],
          })),
        })),
      })),
    };
  }
}
