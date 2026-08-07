import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import {
  DonneesSynthese,
  IA_SERVICE,
  IaService,
} from '../../ia/ia-service.interface';
import { Thematique } from '../../referentiel/entities/thematique.entity';
import { GenererSyntheseDto } from '../dto/generer-synthese.dto';
import { ValiderSyntheseDto } from '../dto/valider-synthese.dto';
import { Synthese } from '../entities/synthese.entity';
import { ValeurIndicateur } from '../entities/valeur-indicateur.entity';
import { StatutSynthese } from '../enums/statut-synthese.enum';

@Injectable()
export class SynthesesService {
  constructor(
    @InjectRepository(Synthese)
    private readonly syntheseRepo: Repository<Synthese>,
    @InjectRepository(Thematique)
    private readonly thematiqueRepo: Repository<Thematique>,
    @InjectRepository(ValeurIndicateur)
    private readonly valeurRepo: Repository<ValeurIndicateur>,
    @Inject(IA_SERVICE)
    private readonly iaService: IaService,
  ) {}

  /**
   * Déclenche la génération IA d'une synthèse (admin).
   * La synthèse créée est EN_ATTENTE_VALIDATION : invisible du public
   * tant que l'admin ne l'a pas validée.
   */
  async generer(dto: GenererSyntheseDto): Promise<Synthese> {
    const thematique = await this.thematiqueRepo.findOne({
      where: { id: dto.thematiqueId },
      relations: { criteres: { indicateurs: true } },
    });
    if (!thematique) {
      throw new NotFoundException(`Thématique ${dto.thematiqueId} introuvable`);
    }

    // Toutes les valeurs du pays, regroupées ensuite par indicateur
    const valeurs = await this.valeurRepo.find({
      where: { paysOuZone: ILike(dto.paysOuZone) },
      relations: { indicateur: true },
      order: { dateMesure: 'ASC' },
    });
    const parIndicateur = new Map<string, { valeur: number; dateMesure: string }[]>();
    for (const v of valeurs) {
      const liste = parIndicateur.get(v.indicateur.id) ?? [];
      liste.push({ valeur: v.valeur, dateMesure: v.dateMesure });
      parIndicateur.set(v.indicateur.id, liste);
    }

    const donnees: DonneesSynthese = {
      paysOuZone: dto.paysOuZone,
      thematique: thematique.libelle,
      indicateurs: thematique.criteres.flatMap((c) =>
        c.indicateurs.map((i) => ({
          critere: c.libelle,
          indicateur: i.libelle,
          valeurs: parIndicateur.get(i.id) ?? [],
        })),
      ),
    };

    const texteGenereIA =
      await this.iaService.genererSyntheseThematique(donnees);

    return this.syntheseRepo.save(
      this.syntheseRepo.create({
        paysOuZone: dto.paysOuZone,
        texteGenereIA,
        thematique,
      }),
    );
  }

  /** File de validation admin, filtrable par statut et/ou pays */
  findAll(statut?: StatutSynthese, pays?: string): Promise<Synthese[]> {
    return this.syntheseRepo.find({
      where: {
        ...(statut ? { statut } : {}),
        ...(pays ? { paysOuZone: ILike(pays) } : {}),
      },
      relations: { thematique: true },
      order: { dateGeneration: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Synthese> {
    const synthese = await this.syntheseRepo.findOne({
      where: { id },
      relations: { thematique: true },
    });
    if (!synthese) {
      throw new NotFoundException(`Synthèse ${id} introuvable`);
    }
    return synthese;
  }

  /**
   * Validation humaine (admin) : publie la synthèse, éventuellement corrigée.
   * C'est le "valideHumainement" du CDC — rien ne sort sans ce clic.
   */
  async valider(id: string, dto: ValiderSyntheseDto): Promise<Synthese> {
    const synthese = await this.findOne(id);
    if (synthese.statut !== StatutSynthese.EN_ATTENTE_VALIDATION) {
      throw new BadRequestException(
        `Cette synthèse est déjà ${synthese.statut} — seule une synthèse en attente peut être validée`,
      );
    }
    synthese.texteFinal = dto.texteCorrige ?? synthese.texteGenereIA;
    synthese.statut = StatutSynthese.PUBLIEE;
    synthese.dateValidation = new Date();
    return this.syntheseRepo.save(synthese);
  }

  /** Rejet par l'admin — conservée en base pour traçabilité, jamais publiée */
  async rejeter(id: string): Promise<Synthese> {
    const synthese = await this.findOne(id);
    if (synthese.statut !== StatutSynthese.EN_ATTENTE_VALIDATION) {
      throw new BadRequestException(
        `Cette synthèse est déjà ${synthese.statut} — seule une synthèse en attente peut être rejetée`,
      );
    }
    synthese.statut = StatutSynthese.REJETEE;
    return this.syntheseRepo.save(synthese);
  }

  /**
   * Pour la fiche-pays publique : la synthèse PUBLIEE la plus récente
   * de chaque thématique, indexée par id de thématique.
   */
  async publieesParThematique(pays: string): Promise<Map<string, Synthese>> {
    const publiees = await this.syntheseRepo.find({
      where: { paysOuZone: ILike(pays), statut: StatutSynthese.PUBLIEE },
      relations: { thematique: true },
      order: { dateValidation: 'DESC' },
    });
    const parThematique = new Map<string, Synthese>();
    for (const s of publiees) {
      // La liste est triée par date décroissante : on garde la 1re rencontrée
      if (!parThematique.has(s.thematique.id)) {
        parThematique.set(s.thematique.id, s);
      }
    }
    return parThematique;
  }
}
