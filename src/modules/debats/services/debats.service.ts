import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DebatDemarrePayload,
  NOTIF_DEBAT_DEMARRE,
} from '../../notifications/events/notification.events';
import { Thematique } from '../../referentiel/entities/thematique.entity';
import { CreateDebatDto } from '../dto/create-debat.dto';
import { UpdateDebatDto } from '../dto/update-debat.dto';
import { AffirmationDebat } from '../entities/affirmation-debat.entity';
import { Debat } from '../entities/debat.entity';
import { SignalementDebat } from '../entities/signalement-debat.entity';
import {
  StatutAffirmation,
  StatutDebat,
  StatutSignalement,
} from '../enums/debats.enums';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { DebatsGateway } from '../gateway/debats.gateway';
import { LiveService } from './live.service';
import { LiveAccess, LivekitService } from './livekit.service';

@Injectable()
export class DebatsService {
  constructor(
    @InjectRepository(Debat)
    private readonly debatRepo: Repository<Debat>,
    @InjectRepository(AffirmationDebat)
    private readonly affirmationRepo: Repository<AffirmationDebat>,
    @InjectRepository(SignalementDebat)
    private readonly signalementRepo: Repository<SignalementDebat>,
    @InjectRepository(Thematique)
    private readonly thematiqueRepo: Repository<Thematique>,
    private readonly eventEmitter: EventEmitter2,
    private readonly gateway: DebatsGateway,
    private readonly liveService: LiveService,
    private readonly livekitService: LivekitService,
  ) {}

  /**
   * Jeton d'accès à la salle vidéo du débat en cours.
   * Réutilise `rejoindre` (valide EN_COURS + enregistre la participation +
   * calcule le rôle), puis délivre le jeton LiveKit adapté : le staff peut
   * publier caméra/micro, le public regarde seulement.
   */
  async obtenirAccesLive(debatId: string, user: AuthUser): Promise<LiveAccess> {
    const { roleParticipation } = await this.liveService.rejoindre(
      debatId,
      user,
    );
    return this.livekitService.genererAcces(debatId, user, roleParticipation);
  }

  async create(dto: CreateDebatDto): Promise<Debat> {
    const thematique = await this.thematiqueRepo.findOneBy({
      id: dto.thematiqueId,
    });
    if (!thematique) {
      throw new NotFoundException(`Thématique ${dto.thematiqueId} introuvable`);
    }
    return this.debatRepo.save(
      this.debatRepo.create({
        titre: dto.titre,
        description: dto.description ?? null,
        dateDebut: new Date(dto.dateDebut),
        moderateurId: dto.moderateurId ?? null,
        thematique,
      }),
    );
  }

  /** Liste publique — filtre : a-venir | en-cours | termines */
  findAll(filtre?: string): Promise<Debat[]> {
    const statutParFiltre: Record<string, StatutDebat> = {
      'a-venir': StatutDebat.PLANIFIE,
      'en-cours': StatutDebat.EN_COURS,
      termines: StatutDebat.TERMINE,
    };
    const statut = filtre ? statutParFiltre[filtre] : undefined;
    return this.debatRepo.find({
      where: statut ? { statut } : {},
      relations: { thematique: true },
      order: { dateDebut: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Debat> {
    const debat = await this.debatRepo.findOne({
      where: { id },
      relations: { thematique: true, affirmations: true },
    });
    if (!debat) {
      throw new NotFoundException(`Débat ${id} introuvable`);
    }
    return debat;
  }

  async update(id: string, dto: UpdateDebatDto): Promise<Debat> {
    const debat = await this.findOne(id);
    if (dto.titre !== undefined) debat.titre = dto.titre;
    if (dto.description !== undefined) debat.description = dto.description;
    if (dto.dateDebut !== undefined) debat.dateDebut = new Date(dto.dateDebut);
    if (dto.moderateurId !== undefined) debat.moderateurId = dto.moderateurId;
    if (dto.thematiqueId !== undefined) {
      const thematique = await this.thematiqueRepo.findOneBy({
        id: dto.thematiqueId,
      });
      if (!thematique) {
        throw new NotFoundException(
          `Thématique ${dto.thematiqueId} introuvable`,
        );
      }
      debat.thematique = thematique;
    }
    return this.debatRepo.save(debat);
  }

  async remove(id: string): Promise<void> {
    const debat = await this.findOne(id);
    await this.debatRepo.remove(debat);
  }

  /**
   * Ouvre la session live : diffusion WebSocket à la salle + événement
   * notif.debat.demarre (le module Notifications de Dev A push aux consentants).
   */
  async demarrer(id: string): Promise<Debat> {
    const debat = await this.findOne(id);
    if (debat.statut !== StatutDebat.PLANIFIE) {
      throw new BadRequestException(
        `Le débat est ${debat.statut} — seul un débat planifié peut démarrer`,
      );
    }
    debat.statut = StatutDebat.EN_COURS;
    const sauvegarde = await this.debatRepo.save(debat);

    this.gateway.diffuserDebatDemarre(debat.id, debat.titre);
    this.eventEmitter.emit(NOTIF_DEBAT_DEMARRE, {
      debatId: debat.id,
      titre: debat.titre,
    } satisfies DebatDemarrePayload);

    return sauvegarde;
  }

  async cloturer(id: string): Promise<Debat> {
    const debat = await this.findOne(id);
    if (debat.statut !== StatutDebat.EN_COURS) {
      throw new BadRequestException(
        `Le débat est ${debat.statut} — seul un débat en cours peut être clôturé`,
      );
    }
    debat.statut = StatutDebat.TERMINE;
    const sauvegarde = await this.debatRepo.save(debat);
    this.gateway.diffuserDebatCloture(debat.id);
    return sauvegarde;
  }

  /** Archive : renseigner l'URL de replay d'un débat terminé */
  async definirReplay(id: string, urlReplay: string): Promise<Debat> {
    const debat = await this.findOne(id);
    if (debat.statut !== StatutDebat.TERMINE) {
      throw new BadRequestException(
        'Le replay ne peut être renseigné que sur un débat terminé',
      );
    }
    debat.urlReplay = urlReplay;
    return this.debatRepo.save(debat);
  }

  /**
   * Le modérateur soumet une affirmation au vote de la salle —
   * diffusée en direct à tous les participants connectés.
   */
  async creerAffirmation(
    debatId: string,
    texte: string,
  ): Promise<AffirmationDebat> {
    const debat = await this.findOne(debatId);
    if (debat.statut !== StatutDebat.EN_COURS) {
      throw new BadRequestException(
        'Les affirmations ne peuvent être soumises que pendant un débat en cours',
      );
    }
    const affirmation = await this.affirmationRepo.save(
      this.affirmationRepo.create({ debat, texte }),
    );
    this.gateway.diffuserNouvelleAffirmation(
      debat.id,
      affirmation.id,
      affirmation.texte,
    );
    return affirmation;
  }

  /** Ferme le vote d'une affirmation et diffuse le décompte final à la salle */
  async fermerAffirmation(affirmationId: string): Promise<AffirmationDebat> {
    const affirmation = await this.affirmationRepo.findOne({
      where: { id: affirmationId },
      relations: { debat: true },
    });
    if (!affirmation) {
      throw new NotFoundException(`Affirmation ${affirmationId} introuvable`);
    }
    if (affirmation.statut !== StatutAffirmation.OUVERTE) {
      throw new BadRequestException('Cette affirmation est déjà fermée');
    }
    affirmation.statut = StatutAffirmation.FERMEE;
    const sauvegarde = await this.affirmationRepo.save(affirmation);
    this.gateway.diffuserAffirmationFermee(
      affirmation.debat.id,
      await this.liveService.decompte(affirmationId),
    );
    return sauvegarde;
  }

  /** File des signalements du débat (modération) */
  findSignalements(debatId: string): Promise<SignalementDebat[]> {
    return this.signalementRepo.find({
      where: { debat: { id: debatId } },
      order: { creeLe: 'ASC' },
    });
  }

  async traiterSignalement(signalementId: string): Promise<SignalementDebat> {
    const signalement = await this.signalementRepo.findOneBy({
      id: signalementId,
    });
    if (!signalement) {
      throw new NotFoundException(`Signalement ${signalementId} introuvable`);
    }
    signalement.statut = StatutSignalement.TRAITE;
    return this.signalementRepo.save(signalement);
  }
}
