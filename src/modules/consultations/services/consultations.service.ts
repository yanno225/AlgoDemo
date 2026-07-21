import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { authenticator } from 'otplib';
import { QueryFailedError, Repository } from 'typeorm';
import { UsersService } from '../../auth/services/users.service';
import { NOTIF_RESULTATS_PUBLIES } from '../../notifications/events/notification.events';
import { CreateConsultationDto } from '../dto/create-consultation.dto';
import { QueryConsultationsDto } from '../dto/query-consultations.dto';
import { UpdateConsultationDto } from '../dto/update-consultation.dto';
import { VoteDto } from '../dto/vote.dto';
import { ConsultationOption } from '../entities/consultation-option.entity';
import { Consultation } from '../entities/consultation.entity';
import { Vote } from '../entities/vote.entity';

const PG_UNIQUE_VIOLATION = '23505';

export interface ResultatOption {
  optionId: string;
  libelle: string;
  nombreVotes: number;
}

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectRepository(Consultation)
    private readonly consultationRepo: Repository<Consultation>,
    @InjectRepository(ConsultationOption)
    private readonly optionRepo: Repository<ConsultationOption>,
    @InjectRepository(Vote)
    private readonly voteRepo: Repository<Vote>,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateConsultationDto): Promise<Consultation> {
    this.validerPeriode(dto.dateOuverture, dto.dateCloture);
    const consultation = this.consultationRepo.create({
      titre: dto.titre,
      description: dto.description,
      resumeVulgarise: dto.resumeVulgarise,
      dateOuverture: new Date(dto.dateOuverture),
      dateCloture: new Date(dto.dateCloture),
      options: dto.options.map((libelle) => this.optionRepo.create({ libelle })),
    });
    return this.consultationRepo.save(consultation);
  }

  async findAll(query: QueryConsultationsDto): Promise<Consultation[]> {
    const qb = this.consultationRepo
      .createQueryBuilder('consultation')
      .leftJoinAndSelect('consultation.options', 'option')
      .orderBy('consultation.dateOuverture', 'DESC');

    if (query.statut === 'ouvertes') {
      qb.where('consultation.dateOuverture <= NOW() AND consultation.dateCloture >= NOW()');
    } else if (query.statut === 'cloturees') {
      qb.where('consultation.dateCloture < NOW()');
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Consultation> {
    const consultation = await this.consultationRepo.findOne({
      where: { id },
      relations: { options: true },
    });
    if (!consultation) {
      throw new NotFoundException(`Consultation ${id} introuvable`);
    }
    return consultation;
  }

  async update(id: string, dto: UpdateConsultationDto): Promise<Consultation> {
    const consultation = await this.findOne(id);
    const dateOuverture = dto.dateOuverture
      ? new Date(dto.dateOuverture)
      : consultation.dateOuverture;
    const dateCloture = dto.dateCloture ? new Date(dto.dateCloture) : consultation.dateCloture;
    this.validerPeriode(dateOuverture.toISOString(), dateCloture.toISOString());

    if (dto.titre !== undefined) consultation.titre = dto.titre;
    if (dto.description !== undefined) consultation.description = dto.description;
    if (dto.resumeVulgarise !== undefined) consultation.resumeVulgarise = dto.resumeVulgarise;
    consultation.dateOuverture = dateOuverture;
    consultation.dateCloture = dateCloture;

    return this.consultationRepo.save(consultation);
  }

  async remove(id: string): Promise<void> {
    const consultation = await this.findOne(id);
    await this.consultationRepo.remove(consultation);
  }

  async publierResultats(id: string): Promise<Consultation> {
    const consultation = await this.findOne(id);
    consultation.resultatsPublies = true;
    const publiee = await this.consultationRepo.save(consultation);

    const votants: { user_id: string }[] = await this.voteRepo.query(
      `SELECT DISTINCT "user_id" FROM "votes" WHERE "consultationId" = $1`,
      [id],
    );
    this.eventEmitter.emit(NOTIF_RESULTATS_PUBLIES, {
      consultationId: publiee.id,
      titre: publiee.titre,
      userIds: votants.map((v) => v.user_id),
    });

    return publiee;
  }

  /** Résultats agrégés publics — visibles uniquement une fois publiés par un admin */
  async resultats(id: string): Promise<ResultatOption[]> {
    const consultation = await this.findOne(id);
    if (!consultation.resultatsPublies) {
      throw new NotFoundException('Résultats non publiés pour cette consultation');
    }
    const comptes: { optionId: string; nombre: string }[] = await this.voteRepo.query(
      `SELECT "optionId", COUNT(*)::int AS nombre FROM "votes" WHERE "consultationId" = $1 GROUP BY "optionId"`,
      [id],
    );
    const parOption = new Map(comptes.map((c) => [c.optionId, Number(c.nombre)]));
    return consultation.options.map((option) => ({
      optionId: option.id,
      libelle: option.libelle,
      nombreVotes: parOption.get(option.id) ?? 0,
    }));
  }

  /** Vote unique sécurisé : 1 vote/consultation, 2FA obligatoire (CDC §6.3) */
  async voter(consultationId: string, userId: string, dto: VoteDto): Promise<Vote> {
    const consultation = await this.findOne(consultationId);
    if (!consultation.estOuverte()) {
      throw new ForbiddenException("Cette consultation n'est pas ouverte au vote");
    }
    const option = consultation.options.find((o) => o.id === dto.optionId);
    if (!option) {
      throw new NotFoundException(`Option ${dto.optionId} introuvable pour cette consultation`);
    }

    const user = await this.usersService.findById(userId);
    if (!user.deuxFaActif) {
      throw new ForbiddenException(
        'La double authentification (2FA) doit être activée pour voter (§6.3) — voir POST /auth/2fa/enable',
      );
    }
    if (!authenticator.check(dto.codeOtp, user.deuxFaSecret ?? '')) {
      throw new UnauthorizedException('Code 2FA invalide');
    }

    const vote = this.voteRepo.create({ userId, consultation, option });
    try {
      return await this.voteRepo.save(vote);
    } catch (e) {
      if (
        e instanceof QueryFailedError &&
        (e as QueryFailedError & { driverError: { code?: string } }).driverError
          ?.code === PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException('Vous avez déjà voté pour cette consultation');
      }
      throw e;
    }
  }

  private validerPeriode(dateOuverture: string, dateCloture: string): void {
    if (new Date(dateCloture) <= new Date(dateOuverture)) {
      throw new BadRequestException(
        "La date de clôture doit être postérieure à la date d'ouverture",
      );
    }
  }
}
