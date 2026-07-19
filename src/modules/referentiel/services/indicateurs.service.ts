import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateIndicateurDto } from '../dto/create-indicateur.dto';
import { UpdateIndicateurDto } from '../dto/update-indicateur.dto';
import { Critere } from '../entities/critere.entity';
import { Indicateur } from '../entities/indicateur.entity';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class IndicateursService {
  constructor(
    @InjectRepository(Indicateur)
    private readonly indicateurRepo: Repository<Indicateur>,
    @InjectRepository(Critere)
    private readonly critereRepo: Repository<Critere>,
  ) {}

  async create(dto: CreateIndicateurDto): Promise<Indicateur> {
    const critere = await this.getCritere(dto.critereId);
    const indicateur = this.indicateurRepo.create({
      libelle: dto.libelle,
      critere,
    });
    try {
      return await this.indicateurRepo.save(indicateur);
    } catch (e) {
      this.rejeterSiDoublon(e, dto.libelle);
      throw e;
    }
  }

  findAll(): Promise<Indicateur[]> {
    return this.indicateurRepo.find({
      relations: { critere: { thematique: true } },
      order: { libelle: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Indicateur> {
    const indicateur = await this.indicateurRepo.findOne({
      where: { id },
      relations: { critere: { thematique: true } },
    });
    if (!indicateur) {
      throw new NotFoundException(`Indicateur ${id} introuvable`);
    }
    return indicateur;
  }

  async update(id: string, dto: UpdateIndicateurDto): Promise<Indicateur> {
    const indicateur = await this.findOne(id);
    if (dto.libelle !== undefined) {
      indicateur.libelle = dto.libelle;
    }
    // Re-rattachement éventuel à un autre critère
    if (dto.critereId !== undefined) {
      indicateur.critere = await this.getCritere(dto.critereId);
    }
    try {
      return await this.indicateurRepo.save(indicateur);
    } catch (e) {
      this.rejeterSiDoublon(e, indicateur.libelle);
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    const indicateur = await this.findOne(id);
    await this.indicateurRepo.remove(indicateur);
  }

  private async getCritere(id: string): Promise<Critere> {
    const critere = await this.critereRepo.findOneBy({ id });
    if (!critere) {
      throw new NotFoundException(`Critère ${id} introuvable`);
    }
    return critere;
  }

  private rejeterSiDoublon(e: unknown, libelle: string): void {
    if (
      e instanceof QueryFailedError &&
      (e as QueryFailedError & { driverError: { code?: string } }).driverError
        ?.code === PG_UNIQUE_VIOLATION
    ) {
      throw new ConflictException(
        `L'indicateur « ${libelle} » existe déjà pour ce critère`,
      );
    }
  }
}
