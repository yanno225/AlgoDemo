import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSignalementDto } from '../dto/create-signalement.dto';
import { TraiterSignalementDto } from '../dto/traiter-signalement.dto';
import { Signalement } from '../entities/signalement.entity';
import { StatutSignalement } from '../enums/statut-signalement.enum';
import { FeedService } from './feed.service';

/** Signalement de contenu — alimente la file de modération unifiée du back-office (§3.10) */
@Injectable()
export class SignalementsService {
  constructor(
    @InjectRepository(Signalement)
    private readonly signalementRepo: Repository<Signalement>,
    private readonly feedService: FeedService,
  ) {}

  async signaler(
    contenuId: string,
    dto: CreateSignalementDto,
    signalePar: string,
  ): Promise<Signalement> {
    await this.feedService.findOne(contenuId); // 404 si le contenu n'existe pas
    const signalement = this.signalementRepo.create({
      contenu: { id: contenuId } as never,
      signalePar,
      motif: dto.motif,
    });
    return this.signalementRepo.save(signalement);
  }

  findEnAttente(): Promise<Signalement[]> {
    return this.signalementRepo.find({
      where: { statut: StatutSignalement.EN_ATTENTE },
      relations: { contenu: true },
      order: { creeLe: 'ASC' },
    });
  }

  async traiter(
    id: string,
    dto: TraiterSignalementDto,
    moderateurId: string,
  ): Promise<Signalement> {
    const signalement = await this.signalementRepo.findOne({
      where: { id },
      relations: { contenu: true },
    });
    if (!signalement) {
      throw new NotFoundException(`Signalement ${id} introuvable`);
    }

    if (dto.action === 'DEPUBLIER') {
      signalement.contenu = await this.feedService.depublier(signalement.contenu.id);
      signalement.statut = StatutSignalement.TRAITE;
    } else {
      signalement.statut = StatutSignalement.REJETE;
    }
    signalement.traiteParUserId = moderateurId;
    signalement.traiteLe = new Date();
    return this.signalementRepo.save(signalement);
  }
}
