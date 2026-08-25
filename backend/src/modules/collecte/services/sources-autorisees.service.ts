import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SourceAutorisee } from '../entities/source-autorisee.entity';
import {
  CreerSourceAutoriseeDto,
  ModifierSourceAutoriseeDto,
} from '../dto/creer-source-autorisee.dto';

/**
 * Gestion de la LISTE BLANCHE des sources (CDC §7). Premier garde-fou du
 * pipeline de collecte : rien n'est ingéré depuis une source inconnue.
 * Pas de suppression physique — on désactive (traçabilité).
 */
@Injectable()
export class SourcesAutoriseesService {
  constructor(
    @InjectRepository(SourceAutorisee)
    private readonly sourceRepo: Repository<SourceAutorisee>,
  ) {}

  lister(): Promise<SourceAutorisee[]> {
    return this.sourceRepo.find({ order: { libelle: 'ASC' } });
  }

  async creer(dto: CreerSourceAutoriseeDto): Promise<SourceAutorisee> {
    const existe = await this.sourceRepo.findOneBy({ libelle: dto.libelle });
    if (existe) {
      throw new ConflictException(
        `La source « ${dto.libelle} » existe déjà dans la liste blanche`,
      );
    }
    return this.sourceRepo.save(this.sourceRepo.create(dto));
  }

  async modifier(
    id: string,
    dto: ModifierSourceAutoriseeDto,
  ): Promise<SourceAutorisee> {
    const source = await this.sourceRepo.findOneBy({ id });
    if (!source) {
      throw new NotFoundException(`Source ${id} introuvable`);
    }
    Object.assign(source, dto);
    return this.sourceRepo.save(source);
  }

  /**
   * Contrôle liste blanche à l'ingestion : la source déclarée (libellé libre
   * saisi par l'admin) et/ou l'URL du document doivent correspondre à une
   * source ACTIVE — par libellé (insensible à la casse et aux accents) ou par
   * domaine. Renvoie la source reconnue, ou null si aucune ne correspond.
   */
  async reconnaitre(
    sourceLabel: string,
    urlSource?: string,
  ): Promise<SourceAutorisee | null> {
    const actives = await this.sourceRepo.findBy({ active: true });
    const label = this.normaliser(sourceLabel);
    const url = urlSource?.toLowerCase() ?? '';

    return (
      actives.find((s) => {
        const libelle = this.normaliser(s.libelle);
        const parLibelle =
          label.includes(libelle) || libelle.includes(label);
        const parDomaine = Boolean(
          s.domaine &&
            (url.includes(s.domaine.toLowerCase()) ||
              label.includes(this.normaliser(s.domaine))),
        );
        return parLibelle || parDomaine;
      }) ?? null
    );
  }

  private normaliser(texte: string): string {
    return texte
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim();
  }
}
