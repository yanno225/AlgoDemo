import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, QueryFailedError, Repository } from 'typeorm';
import { Indicateur } from '../../referentiel/entities/indicateur.entity';
import { CreateValeurIndicateurDto } from '../dto/create-valeur-indicateur.dto';
import { UpdateValeurIndicateurDto } from '../dto/update-valeur-indicateur.dto';
import { ValeurIndicateur } from '../entities/valeur-indicateur.entity';

const PG_UNIQUE_VIOLATION = '23505';

/** Bilan renvoyé par l'import CSV */
export interface BilanImportCsv {
  lignesTraitees: number;
  creees: number;
  doublonsIgnores: number;
  erreurs: { ligne: number; message: string }[];
}

@Injectable()
export class ValeursIndicateursService {
  constructor(
    @InjectRepository(ValeurIndicateur)
    private readonly valeurRepo: Repository<ValeurIndicateur>,
    @InjectRepository(Indicateur)
    private readonly indicateurRepo: Repository<Indicateur>,
  ) {}

  async create(dto: CreateValeurIndicateurDto): Promise<ValeurIndicateur> {
    const indicateur = await this.getIndicateur(dto.indicateurId);
    const valeur = this.valeurRepo.create({
      valeur: dto.valeur,
      dateMesure: dto.dateMesure,
      paysOuZone: dto.paysOuZone,
      source: dto.source,
      indicateur,
    });
    try {
      return await this.valeurRepo.save(valeur);
    } catch (e) {
      this.rejeterSiDoublon(e);
      throw e;
    }
  }

  /** Liste filtrable par pays et/ou indicateur (lecture publique) */
  findAll(pays?: string, indicateurId?: string): Promise<ValeurIndicateur[]> {
    return this.valeurRepo.find({
      where: {
        ...(pays ? { paysOuZone: ILike(pays) } : {}),
        ...(indicateurId ? { indicateur: { id: indicateurId } } : {}),
      },
      relations: { indicateur: true },
      order: { paysOuZone: 'ASC', dateMesure: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ValeurIndicateur> {
    const valeur = await this.valeurRepo.findOne({
      where: { id },
      relations: { indicateur: { critere: { thematique: true } } },
    });
    if (!valeur) {
      throw new NotFoundException(`Valeur d'indicateur ${id} introuvable`);
    }
    return valeur;
  }

  async update(
    id: string,
    dto: UpdateValeurIndicateurDto,
  ): Promise<ValeurIndicateur> {
    const valeur = await this.findOne(id);
    if (dto.indicateurId !== undefined) {
      valeur.indicateur = await this.getIndicateur(dto.indicateurId);
    }
    if (dto.valeur !== undefined) valeur.valeur = dto.valeur;
    if (dto.dateMesure !== undefined) valeur.dateMesure = dto.dateMesure;
    if (dto.paysOuZone !== undefined) valeur.paysOuZone = dto.paysOuZone;
    if (dto.source !== undefined) valeur.source = dto.source;
    try {
      return await this.valeurRepo.save(valeur);
    } catch (e) {
      this.rejeterSiDoublon(e);
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    const valeur = await this.findOne(id);
    await this.valeurRepo.remove(valeur);
  }

  /**
   * Import en lot depuis un CSV (outil admin, en attendant le scraping).
   *
   * Format attendu — 1ère ligne d'en-tête obligatoire, séparateur ";" ou "," :
   *   indicateurId;valeur;dateMesure;paysOuZone;source
   *   d0b7...-uuid;66,8;2024-01-01;Côte d'Ivoire;Annuaire statistique 2024
   *
   * Avec le séparateur ";", la virgule décimale ("66,8") est acceptée.
   * Les doublons (même indicateur + pays + date) sont ignorés, pas écrasés.
   */
  async importerCsv(contenu: string): Promise<BilanImportCsv> {
    const lignes = contenu
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lignes.length < 2) {
      throw new BadRequestException(
        'CSV vide ou sans données (une ligne d’en-tête + au moins une ligne de valeurs attendues)',
      );
    }

    // Détection du séparateur sur la ligne d'en-tête
    const separateur = lignes[0].includes(';') ? ';' : ',';
    const entetes = lignes[0].split(separateur).map((e) => e.trim());
    const attendu = ['indicateurId', 'valeur', 'dateMesure', 'paysOuZone', 'source'];
    if (attendu.some((col, i) => entetes[i] !== col)) {
      throw new BadRequestException(
        `En-tête CSV invalide. Attendu : ${attendu.join(separateur)}`,
      );
    }

    const bilan: BilanImportCsv = {
      lignesTraitees: lignes.length - 1,
      creees: 0,
      doublonsIgnores: 0,
      erreurs: [],
    };

    for (let i = 1; i < lignes.length; i++) {
      const numLigne = i + 1; // numéro humain (en comptant l'en-tête)
      const champs = lignes[i].split(separateur).map((c) => c.trim());
      if (champs.length < 5) {
        bilan.erreurs.push({
          ligne: numLigne,
          message: `5 colonnes attendues, ${champs.length} trouvées`,
        });
        continue;
      }

      const [indicateurId, valeurBrute, dateMesure, paysOuZone, source] = champs;
      // Virgule décimale tolérée quand le séparateur de colonnes est ";"
      const valeur = parseFloat(
        separateur === ';' ? valeurBrute.replace(',', '.') : valeurBrute,
      );
      if (Number.isNaN(valeur)) {
        bilan.erreurs.push({
          ligne: numLigne,
          message: `Valeur non numérique : "${valeurBrute}"`,
        });
        continue;
      }

      try {
        const indicateur = await this.getIndicateur(indicateurId);
        const existe = await this.valeurRepo.findOne({
          where: {
            indicateur: { id: indicateur.id },
            paysOuZone: ILike(paysOuZone),
            dateMesure,
          },
        });
        if (existe) {
          bilan.doublonsIgnores++;
          continue;
        }
        await this.valeurRepo.save(
          this.valeurRepo.create({
            valeur,
            dateMesure,
            paysOuZone,
            source,
            indicateur,
          }),
        );
        bilan.creees++;
      } catch (e) {
        bilan.erreurs.push({
          ligne: numLigne,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return bilan;
  }

  private async getIndicateur(id: string): Promise<Indicateur> {
    const indicateur = await this.indicateurRepo.findOneBy({ id });
    if (!indicateur) {
      throw new NotFoundException(`Indicateur ${id} introuvable`);
    }
    return indicateur;
  }

  private rejeterSiDoublon(e: unknown): void {
    if (
      e instanceof QueryFailedError &&
      (e as QueryFailedError & { driverError: { code?: string } }).driverError
        ?.code === PG_UNIQUE_VIOLATION
    ) {
      throw new ConflictException(
        'Une valeur existe déjà pour cet indicateur, ce pays et cette date (modifier la valeur existante plutôt)',
      );
    }
  }
}
