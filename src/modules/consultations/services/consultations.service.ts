import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { authenticator } from 'otplib';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { UsersService } from '../../auth/services/users.service';
import { NOTIF_RESULTATS_PUBLIES } from '../../notifications/events/notification.events';
import { CreateConsultationDto } from '../dto/create-consultation.dto';
import { QueryConsultationsDto } from '../dto/query-consultations.dto';
import { UpdateConsultationDto } from '../dto/update-consultation.dto';
import { VoteDto } from '../dto/vote.dto';
import { TypeConsultation } from '../enums/type-consultation.enum';
import { Bulletin } from '../entities/bulletin.entity';
import { ConsultationOption } from '../entities/consultation-option.entity';
import { Consultation } from '../entities/consultation.entity';
import { ParticipationConsultation } from '../entities/participation-consultation.entity';

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
    @InjectRepository(ParticipationConsultation)
    private readonly participationRepo: Repository<ParticipationConsultation>,
    @InjectRepository(Bulletin)
    private readonly bulletinRepo: Repository<Bulletin>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateConsultationDto): Promise<Consultation> {
    this.validerPeriode(dto.dateOuverture, dto.dateCloture);
    const consultation = this.consultationRepo.create({
      type: dto.type ?? TypeConsultation.CONSULTATION,
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

    if (query.type) {
      qb.andWhere('consultation.type = :type', { type: query.type });
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

    // Les votants sont notifiés depuis l'émargement — la seule table qui
    // sache encore qui a voté.
    const votants: { user_id: string }[] = await this.participationRepo.query(
      `SELECT "user_id" FROM "participations_consultation" WHERE "consultationId" = $1`,
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
    // Dépouillement : on compte les bulletins de l'urne, sans jamais toucher
    // à l'émargement.
    const comptes: { optionId: string; nombre: string }[] = await this.bulletinRepo.query(
      `SELECT "optionId", COUNT(*)::int AS nombre FROM "bulletins" WHERE "consultationId" = $1 GROUP BY "optionId"`,
      [id],
    );
    const parOption = new Map(comptes.map((c) => [c.optionId, Number(c.nombre)]));
    return consultation.options.map((option) => ({
      optionId: option.id,
      libelle: option.libelle,
      nombreVotes: parOption.get(option.id) ?? 0,
    }));
  }

  /**
   * Vote unique et SECRET (CDC §6.3).
   *
   * L'émargement (qui vote) et le bulletin (ce qui est voté) sont écrits dans
   * deux tables sans lien entre elles, mais dans une MÊME transaction : sinon
   * une panne entre les deux écritures produirait soit un bulletin fantôme,
   * soit un citoyen émargé dont la voix serait perdue et qui ne pourrait plus
   * voter.
   *
   * La réponse ne renvoie volontairement aucun identifiant de bulletin : le
   * fournir permettrait au client de rattacher a posteriori un votant à son
   * choix.
   */
  async voter(
    consultationId: string,
    userId: string,
    dto: VoteDto,
  ): Promise<{ message: string; participeLe: Date }> {
    const consultation = await this.findOne(consultationId);
    if (!consultation.estOuverte()) {
      throw new ForbiddenException("Cette consultation n'est pas ouverte au vote");
    }
    const option = consultation.options.find((o) => o.id === dto.optionId);
    if (!option) {
      throw new NotFoundException(`Option ${dto.optionId} introuvable pour cette consultation`);
    }

    // 2FA désactivée pour la v1 (choix produit) — l'unicité du vote (1 par
    // utilisateur/consultation) reste garantie par la contrainte en base.
    // Pour réactiver la 2FA (CDC §6.3), restaurer la vérification du code TOTP
    // (user.deuxFaActif + authenticator.check(dto.codeOtp, user.deuxFaSecret)).

    try {
      return await this.dataSource.transaction(async (manager) => {
        // L'émargement d'abord : sa contrainte d'unicité est le rempart
        // contre le double vote, et elle doit se déclencher avant qu'un
        // second bulletin ne soit déposé dans l'urne.
        const participation = await manager.save(
          manager.create(ParticipationConsultation, { userId, consultation }),
        );
        await manager.save(manager.create(Bulletin, { consultation, option }));

        return {
          message: 'Votre vote a bien été enregistré.',
          participeLe: participation.participeLe,
        };
      });
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

  /** Le citoyen a-t-il déjà voté ? Sans révéler son choix. */
  async aVote(consultationId: string, userId: string): Promise<boolean> {
    const nombre = await this.participationRepo.count({
      where: { userId, consultation: { id: consultationId } },
    });
    return nombre > 0;
  }

  private validerPeriode(dateOuverture: string, dateCloture: string): void {
    if (new Date(dateCloture) <= new Date(dateOuverture)) {
      throw new BadRequestException(
        "La date de clôture doit être postérieure à la date d'ouverture",
      );
    }
  }
}
