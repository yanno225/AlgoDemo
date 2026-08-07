import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NOTIF_CONTENU_PUBLIE } from '../../notifications/events/notification.events';
import { Thematique } from '../../referentiel/entities/thematique.entity';
import { CreateContenuDto } from '../dto/create-contenu.dto';
import { QueryFeedDto } from '../dto/query-feed.dto';
import { UpdateContenuDto } from '../dto/update-contenu.dto';
import { DebatResumeValidePayload } from '../events/debat-resume-valide.event';
import { Contenu } from '../entities/contenu.entity';
import { HistoriqueLecture } from '../entities/historique-lecture.entity';
import { StatutVerification } from '../enums/statut-verification.enum';
import { TypeContenu } from '../enums/type-contenu.enum';

export interface PageResultat<T> {
  data: T[];
  total: number;
  page: number;
  limite: number;
}

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Contenu)
    private readonly contenuRepo: Repository<Contenu>,
    @InjectRepository(HistoriqueLecture)
    private readonly historiqueRepo: Repository<HistoriqueLecture>,
    @InjectRepository(Thematique)
    private readonly thematiqueRepo: Repository<Thematique>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateContenuDto, auteurId: string): Promise<Contenu> {
    const thematique = await this.getThematique(dto.thematiqueId);
    const contenu = this.contenuRepo.create({
      titre: dto.titre,
      corps: dto.corps,
      type: dto.type,
      thematique,
      statutVerification: dto.statutVerification ?? StatutVerification.NON_VERIFIE,
      estOfficiel: dto.estOfficiel ?? false,
      source: dto.source,
      urlMedia: dto.urlMedia,
      telechargeable: dto.telechargeable ?? false,
      auteurId,
    });
    return this.contenuRepo.save(contenu);
  }

  /** GET /feed — pagination, filtres, recherche mot-clé, tri (CDC §6.2, §9.4) */
  async findPublies(query: QueryFeedDto): Promise<PageResultat<Contenu>> {
    const qb = this.contenuRepo
      .createQueryBuilder('contenu')
      .leftJoinAndSelect('contenu.thematique', 'thematique')
      .where('contenu.estPublie = true');

    if (query.thematiqueId) {
      qb.andWhere('thematique.id = :thematiqueId', { thematiqueId: query.thematiqueId });
    }
    if (query.type) {
      qb.andWhere('contenu.type = :type', { type: query.type });
    }
    if (query.statutVerification) {
      qb.andWhere('contenu.statutVerification = :statutVerification', {
        statutVerification: query.statutVerification,
      });
    }
    if (query.telechargeable !== undefined) {
      qb.andWhere('contenu.telechargeable = :telechargeable', {
        telechargeable: query.telechargeable === 'true',
      });
    }
    if (query.dateDebut) {
      qb.andWhere('contenu.publieLe >= :dateDebut', { dateDebut: query.dateDebut });
    }
    if (query.dateFin) {
      qb.andWhere('contenu.publieLe <= :dateFin', { dateFin: query.dateFin });
    }
    if (query.q) {
      qb.andWhere('(contenu.titre ILIKE :q OR contenu.corps ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }

    if (query.tri === 'pertinence') {
      // Pertinence simple : officiel puis vérifié en premier, plus récent en dernier recours
      qb.orderBy('contenu.estOfficiel', 'DESC')
        .addOrderBy('contenu.statutVerification', 'DESC')
        .addOrderBy('contenu.publieLe', 'DESC');
    } else {
      qb.orderBy('contenu.publieLe', 'DESC');
    }

    const page = query.page;
    const limite = query.limite;
    qb.skip((page - 1) * limite).take(limite);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limite };
  }

  async findOne(id: string): Promise<Contenu> {
    const contenu = await this.contenuRepo.findOne({
      where: { id },
      relations: { thematique: true },
    });
    if (!contenu) {
      throw new NotFoundException(`Contenu ${id} introuvable`);
    }
    return contenu;
  }

  async update(id: string, dto: UpdateContenuDto): Promise<Contenu> {
    const contenu = await this.findOne(id);
    if (dto.thematiqueId !== undefined) {
      contenu.thematique = await this.getThematique(dto.thematiqueId);
    }
    if (dto.titre !== undefined) contenu.titre = dto.titre;
    if (dto.corps !== undefined) contenu.corps = dto.corps;
    if (dto.type !== undefined) contenu.type = dto.type;
    if (dto.statutVerification !== undefined) contenu.statutVerification = dto.statutVerification;
    if (dto.estOfficiel !== undefined) contenu.estOfficiel = dto.estOfficiel;
    if (dto.source !== undefined) contenu.source = dto.source;
    if (dto.urlMedia !== undefined) contenu.urlMedia = dto.urlMedia;
    if (dto.telechargeable !== undefined) contenu.telechargeable = dto.telechargeable;
    return this.contenuRepo.save(contenu);
  }

  async publier(id: string): Promise<Contenu> {
    const contenu = await this.findOne(id);
    contenu.estPublie = true;
    contenu.publieLe = new Date();
    const publie = await this.contenuRepo.save(contenu);
    this.eventEmitter.emit(NOTIF_CONTENU_PUBLIE, {
      contenuId: publie.id,
      titre: publie.titre,
    });
    return publie;
  }

  async depublier(id: string): Promise<Contenu> {
    const contenu = await this.findOne(id);
    contenu.estPublie = false;
    return this.contenuRepo.save(contenu);
  }

  async setUrlAudio(id: string, urlAudio: string): Promise<Contenu> {
    const contenu = await this.findOne(id);
    contenu.urlAudio = urlAudio;
    return this.contenuRepo.save(contenu);
  }

  async remove(id: string): Promise<void> {
    const contenu = await this.findOne(id);
    await this.contenuRepo.remove(contenu);
  }

  /** Marque un contenu comme lu par l'utilisateur courant (idempotent) */
  async marquerLu(userId: string, contenuId: string): Promise<void> {
    await this.findOne(contenuId);
    const existant = await this.historiqueRepo.findOne({
      where: { userId, contenu: { id: contenuId } },
    });
    if (existant) {
      return;
    }
    await this.historiqueRepo.save(
      this.historiqueRepo.create({ userId, contenu: { id: contenuId } as Contenu }),
    );
  }

  async historique(userId: string): Promise<HistoriqueLecture[]> {
    return this.historiqueRepo.find({
      where: { userId },
      relations: { contenu: { thematique: true } },
      order: { luLe: 'DESC' },
    });
  }

  /** Package hors-ligne (§9.4) : contenus publiés marqués téléchargeables */
  findOffline(): Promise<Contenu[]> {
    return this.contenuRepo.find({
      where: { estPublie: true, telechargeable: true },
      relations: { thematique: true },
      order: { publieLe: 'DESC' },
    });
  }

  /**
   * Écouté depuis DebatResumeListener (événement `debat.resume.valide`, Dev B).
   * Publie automatiquement le résumé validé comme Contenu du feed.
   */
  async publierResumeDebat(payload: DebatResumeValidePayload): Promise<Contenu> {
    const thematique = await this.getThematique(payload.thematiqueId);
    const contenu = this.contenuRepo.create({
      titre: payload.titre,
      corps: payload.texteResume,
      type: TypeContenu.ARTICLE,
      thematique,
      statutVerification: StatutVerification.VERIFIE,
      estOfficiel: true,
      source: 'Résumé de débat (IA + validation humaine)',
      urlMedia: payload.urlReplay,
      auteurId: payload.valideParUserId,
      estPublie: true,
      publieLe: new Date(),
    });
    return this.contenuRepo.save(contenu);
  }

  private async getThematique(id: string): Promise<Thematique> {
    const thematique = await this.thematiqueRepo.findOneBy({ id });
    if (!thematique) {
      throw new NotFoundException(`Thématique ${id} introuvable`);
    }
    return thematique;
  }
}
