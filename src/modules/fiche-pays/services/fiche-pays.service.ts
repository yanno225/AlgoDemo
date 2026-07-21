import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Thematique } from '../../referentiel/entities/thematique.entity';
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
    private readonly synthesesService: SynthesesService,
  ) {}

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
