import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NOTIF_MODERATION } from '../../notifications/events/notification.events';
import { Thematique } from '../../referentiel/entities/thematique.entity';
import { CreateAvisDto } from '../dto/create-avis.dto';
import { ModererAvisDto } from '../dto/moderer-avis.dto';
import { Avis } from '../entities/avis.entity';
import { StatutModeration } from '../enums/statut-moderation.enum';

@Injectable()
export class AvisService {
  constructor(
    @InjectRepository(Avis)
    private readonly avisRepo: Repository<Avis>,
    @InjectRepository(Thematique)
    private readonly thematiqueRepo: Repository<Thematique>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Soumission — passe systématiquement en modération (§6.2, exigence de modération avant publication) */
  async create(dto: CreateAvisDto, auteurId: string): Promise<Avis> {
    const thematique = await this.thematiqueRepo.findOneBy({ id: dto.thematiqueId });
    if (!thematique) {
      throw new NotFoundException(`Thématique ${dto.thematiqueId} introuvable`);
    }
    const avis = this.avisRepo.create({
      texte: dto.texte,
      thematique,
      auteurId,
      statutModeration: StatutModeration.EN_ATTENTE,
    });
    return this.avisRepo.save(avis);
  }

  /** Liste publique — uniquement les avis approuvés */
  findApprouves(thematiqueId?: string): Promise<Avis[]> {
    return this.avisRepo.find({
      where: {
        statutModeration: StatutModeration.APPROUVE,
        ...(thematiqueId ? { thematique: { id: thematiqueId } } : {}),
      },
      relations: { thematique: true },
      order: { creeLe: 'DESC' },
    });
  }

  /** File de modération (POINT_FOCAL, ADMIN) */
  findEnAttente(): Promise<Avis[]> {
    return this.avisRepo.find({
      where: { statutModeration: StatutModeration.EN_ATTENTE },
      relations: { thematique: true },
      order: { creeLe: 'ASC' },
    });
  }

  /** Détail public — un avis non approuvé n'est jamais exposé publiquement */
  async findOneApprouve(id: string): Promise<Avis> {
    const avis = await this.avisRepo.findOne({
      where: { id, statutModeration: StatutModeration.APPROUVE },
      relations: { thematique: true },
    });
    if (!avis) {
      throw new NotFoundException(`Avis ${id} introuvable`);
    }
    return avis;
  }

  async moderer(id: string, dto: ModererAvisDto, moderateurId: string): Promise<Avis> {
    const avis = await this.avisRepo.findOne({ where: { id }, relations: { thematique: true } });
    if (!avis) {
      throw new NotFoundException(`Avis ${id} introuvable`);
    }
    avis.statutModeration =
      dto.decision === 'APPROUVE' ? StatutModeration.APPROUVE : StatutModeration.REJETE;
    avis.motifModeration = dto.motif ?? null;
    avis.modereParUserId = moderateurId;
    avis.modereLe = new Date();
    const modere = await this.avisRepo.save(avis);

    this.eventEmitter.emit(NOTIF_MODERATION, {
      avisId: modere.id,
      decision: dto.decision,
      userIds: [modere.auteurId],
    });

    return modere;
  }
}
