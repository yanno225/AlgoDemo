import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateCritereDto } from '../dto/create-critere.dto';
import { UpdateCritereDto } from '../dto/update-critere.dto';
import { Critere } from '../entities/critere.entity';
import { Thematique } from '../entities/thematique.entity';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class CriteresService {
  constructor(
    @InjectRepository(Critere)
    private readonly critereRepo: Repository<Critere>,
    @InjectRepository(Thematique)
    private readonly thematiqueRepo: Repository<Thematique>,
  ) {}

  async create(dto: CreateCritereDto): Promise<Critere> {
    const thematique = await this.getThematique(dto.thematiqueId);
    const critere = this.critereRepo.create({
      libelle: dto.libelle,
      thematique,
    });
    try {
      return await this.critereRepo.save(critere);
    } catch (e) {
      this.rejeterSiDoublon(e, dto.libelle);
      throw e;
    }
  }

  findAll(): Promise<Critere[]> {
    return this.critereRepo.find({
      relations: { thematique: true },
      order: { libelle: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Critere> {
    const critere = await this.critereRepo.findOne({
      where: { id },
      relations: { thematique: true, indicateurs: true },
    });
    if (!critere) {
      throw new NotFoundException(`Critère ${id} introuvable`);
    }
    return critere;
  }

  async update(id: string, dto: UpdateCritereDto): Promise<Critere> {
    const critere = await this.findOne(id);
    if (dto.libelle !== undefined) {
      critere.libelle = dto.libelle;
    }
    // Re-rattachement éventuel à une autre thématique
    if (dto.thematiqueId !== undefined) {
      critere.thematique = await this.getThematique(dto.thematiqueId);
    }
    try {
      return await this.critereRepo.save(critere);
    } catch (e) {
      this.rejeterSiDoublon(e, critere.libelle);
      throw e;
    }
  }

  /** La suppression entraîne celle des indicateurs rattachés (cascade) */
  async remove(id: string): Promise<void> {
    const critere = await this.findOne(id);
    await this.critereRepo.remove(critere);
  }

  private async getThematique(id: string): Promise<Thematique> {
    const thematique = await this.thematiqueRepo.findOneBy({ id });
    if (!thematique) {
      throw new NotFoundException(`Thématique ${id} introuvable`);
    }
    return thematique;
  }

  private rejeterSiDoublon(e: unknown, libelle: string): void {
    if (
      e instanceof QueryFailedError &&
      (e as QueryFailedError & { driverError: { code?: string } }).driverError
        ?.code === PG_UNIQUE_VIOLATION
    ) {
      throw new ConflictException(
        `Le critère « ${libelle} » existe déjà dans cette thématique`,
      );
    }
  }
}
