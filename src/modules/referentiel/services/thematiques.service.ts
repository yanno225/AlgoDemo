import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateThematiqueDto } from '../dto/create-thematique.dto';
import { UpdateThematiqueDto } from '../dto/update-thematique.dto';
import { Thematique } from '../entities/thematique.entity';

/** Code PostgreSQL d'une violation de contrainte d'unicité */
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class ThematiquesService {
  constructor(
    @InjectRepository(Thematique)
    private readonly thematiqueRepo: Repository<Thematique>,
  ) {}

  async create(dto: CreateThematiqueDto): Promise<Thematique> {
    try {
      return await this.thematiqueRepo.save(this.thematiqueRepo.create(dto));
    } catch (e) {
      this.rejeterSiDoublon(e, dto.libelle);
      throw e;
    }
  }

  findAll(): Promise<Thematique[]> {
    return this.thematiqueRepo.find({ order: { libelle: 'ASC' } });
  }

  /**
   * Hiérarchie complète Thématique › Critère › Indicateur.
   * Consommée par les filtres du Feed (Dev A) et par la Fiche-pays.
   */
  arbre(): Promise<Thematique[]> {
    return this.thematiqueRepo.find({
      relations: { criteres: { indicateurs: true } },
      order: {
        libelle: 'ASC',
        criteres: { libelle: 'ASC', indicateurs: { libelle: 'ASC' } },
      },
    });
  }

  async findOne(id: string): Promise<Thematique> {
    const thematique = await this.thematiqueRepo.findOne({
      where: { id },
      relations: { criteres: true },
    });
    if (!thematique) {
      throw new NotFoundException(`Thématique ${id} introuvable`);
    }
    return thematique;
  }

  async update(id: string, dto: UpdateThematiqueDto): Promise<Thematique> {
    const thematique = await this.findOne(id);
    Object.assign(thematique, dto);
    try {
      return await this.thematiqueRepo.save(thematique);
    } catch (e) {
      this.rejeterSiDoublon(e, dto.libelle ?? '');
      throw e;
    }
  }

  /** La suppression entraîne celle des critères et indicateurs rattachés (cascade) */
  async remove(id: string): Promise<void> {
    const thematique = await this.findOne(id);
    await this.thematiqueRepo.remove(thematique);
  }

  private rejeterSiDoublon(e: unknown, libelle: string): void {
    if (
      e instanceof QueryFailedError &&
      (e as QueryFailedError & { driverError: { code?: string } }).driverError
        ?.code === PG_UNIQUE_VIOLATION
    ) {
      throw new ConflictException(
        `Une thématique nommée « ${libelle} » existe déjà`,
      );
    }
  }
}
