import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { Role } from '../../../common/enums/role.enum';
import { AffirmationDebat } from '../entities/affirmation-debat.entity';
import { Debat } from '../entities/debat.entity';
import { ParticipationDebat } from '../entities/participation-debat.entity';
import { SignalementDebat } from '../entities/signalement-debat.entity';
import { TranscriptionSegment } from '../entities/transcription-segment.entity';
import { VoteAffirmation } from '../entities/vote-affirmation.entity';
import {
  RoleParticipation,
  StatutAffirmation,
  StatutDebat,
} from '../enums/debats.enums';

/** Décompte en direct d'une affirmation */
export interface DecompteVotes {
  affirmationId: string;
  valides: number;
  invalides: number;
}

/**
 * Logique métier de la session live — consommée par la gateway WebSocket.
 * Tout est persisté : participations, votes, signalements (traçabilité CDC).
 */
@Injectable()
export class LiveService {
  constructor(
    @InjectRepository(Debat)
    private readonly debatRepo: Repository<Debat>,
    @InjectRepository(ParticipationDebat)
    private readonly participationRepo: Repository<ParticipationDebat>,
    @InjectRepository(AffirmationDebat)
    private readonly affirmationRepo: Repository<AffirmationDebat>,
    @InjectRepository(VoteAffirmation)
    private readonly voteRepo: Repository<VoteAffirmation>,
    @InjectRepository(SignalementDebat)
    private readonly signalementRepo: Repository<SignalementDebat>,
    @InjectRepository(TranscriptionSegment)
    private readonly transcriptionRepo: Repository<TranscriptionSegment>,
  ) {}

  /**
   * Enregistre un segment de transcription (ce qu'un intervenant vient de dire,
   * converti en texte par son navigateur). Réservé aux intervenants/modérateur
   * — les spectateurs ne parlent pas.
   */
  async enregistrerTranscription(
    debatId: string,
    user: AuthUser,
    texte: string,
  ): Promise<void> {
    const propre = (texte ?? '').trim();
    if (!propre) return;

    const participation = await this.participationRepo.findOne({
      where: { debat: { id: debatId }, userId: user.id },
    });
    if (
      !participation ||
      participation.role === RoleParticipation.SPECTATEUR
    ) {
      throw new BadRequestException(
        'Seuls les intervenants et le modérateur alimentent la transcription',
      );
    }

    await this.transcriptionRepo.save(
      this.transcriptionRepo.create({
        debat: { id: debatId } as Debat,
        userId: user.id,
        intervenant: user.email,
        texte: propre.slice(0, 2000),
      }),
    );
  }

  /** Verbatim complet du débat, dans l'ordre chronologique */
  getTranscription(
    debatId: string,
  ): Promise<{ intervenant: string; texte: string }[]> {
    return this.transcriptionRepo
      .find({
        where: { debat: { id: debatId } },
        order: { creeLe: 'ASC' },
        select: { intervenant: true, texte: true },
      })
      .then((segments) =>
        segments.map((s) => ({ intervenant: s.intervenant, texte: s.texte })),
      );
  }

  /**
   * Rejoindre un débat EN_COURS : enregistre la participation (une seule par
   * utilisateur) et détermine son rôle dans la session.
   */
  async rejoindre(
    debatId: string,
    user: AuthUser,
  ): Promise<{ debat: Debat; roleParticipation: RoleParticipation }> {
    const debat = await this.debatRepo.findOne({
      where: { id: debatId },
      relations: { thematique: true },
    });
    if (!debat) {
      throw new NotFoundException(`Débat ${debatId} introuvable`);
    }
    if (debat.statut !== StatutDebat.EN_COURS) {
      throw new BadRequestException(
        `Le débat n'est pas en cours (statut : ${debat.statut})`,
      );
    }

    // Rôle dans la session : modérateur désigné > staff certifié > spectateur
    const roleParticipation =
      debat.moderateurId === user.id
        ? RoleParticipation.MODERATEUR
        : user.role === Role.ADMIN || user.role === Role.POINT_FOCAL
          ? RoleParticipation.INTERVENANT
          : RoleParticipation.SPECTATEUR;

    const existante = await this.participationRepo.findOne({
      where: { debat: { id: debatId }, userId: user.id },
    });
    if (!existante) {
      await this.participationRepo.save(
        this.participationRepo.create({
          debat,
          userId: user.id,
          role: roleParticipation,
        }),
      );
    }

    return { debat, roleParticipation };
  }

  /** Débat avec sa thématique (utilisé pour la génération du résumé) */
  async getDebatComplet(debatId: string): Promise<Debat> {
    const debat = await this.debatRepo.findOne({
      where: { id: debatId },
      relations: { thematique: true },
    });
    if (!debat) {
      throw new NotFoundException(`Débat ${debatId} introuvable`);
    }
    return debat;
  }

  /** Affirmations ouvertes du débat, avec leur décompte courant */
  async etatDesVotes(debatId: string): Promise<
    {
      id: string;
      texte: string;
      statut: StatutAffirmation;
      valides: number;
      invalides: number;
    }[]
  > {
    const affirmations = await this.affirmationRepo.find({
      where: { debat: { id: debatId } },
      order: { creeLe: 'ASC' },
    });
    const etats = [];
    for (const a of affirmations) {
      const decompte = await this.decompte(a.id);
      etats.push({
        id: a.id,
        texte: a.texte,
        statut: a.statut,
        valides: decompte.valides,
        invalides: decompte.invalides,
      });
    }
    return etats;
  }

  /**
   * Vote en direct : valider (true) ou invalider (false) une affirmation
   * OUVERTE. Revoter remplace le vote précédent (un seul vote par personne).
   */
  async voter(
    affirmationId: string,
    user: AuthUser,
    valide: boolean,
  ): Promise<{ debatId: string; decompte: DecompteVotes }> {
    const affirmation = await this.affirmationRepo.findOne({
      where: { id: affirmationId },
      relations: { debat: true },
    });
    if (!affirmation) {
      throw new NotFoundException(`Affirmation ${affirmationId} introuvable`);
    }
    if (affirmation.statut !== StatutAffirmation.OUVERTE) {
      throw new BadRequestException('Le vote sur cette affirmation est fermé');
    }
    if (affirmation.debat.statut !== StatutDebat.EN_COURS) {
      throw new BadRequestException('Le débat est terminé');
    }

    const existant = await this.voteRepo.findOne({
      where: { affirmation: { id: affirmationId }, userId: user.id },
    });
    if (existant) {
      existant.valide = valide;
      await this.voteRepo.save(existant);
    } else {
      await this.voteRepo.save(
        this.voteRepo.create({ affirmation, userId: user.id, valide }),
      );
    }

    return {
      debatId: affirmation.debat.id,
      decompte: await this.decompte(affirmationId),
    };
  }

  /** Signalement en direct d'une fausse information (persisté + relayé au staff) */
  async signaler(
    debatId: string,
    user: AuthUser,
    message: string,
  ): Promise<SignalementDebat> {
    const debat = await this.debatRepo.findOneBy({ id: debatId });
    if (!debat) {
      throw new NotFoundException(`Débat ${debatId} introuvable`);
    }
    if (debat.statut !== StatutDebat.EN_COURS) {
      throw new BadRequestException('Le débat n’est pas en cours');
    }
    const texte = (message ?? '').trim().slice(0, 500);
    if (!texte) {
      throw new BadRequestException('Le message du signalement est vide');
    }
    return this.signalementRepo.save(
      this.signalementRepo.create({ debat, userId: user.id, message: texte }),
    );
  }

  async decompte(affirmationId: string): Promise<DecompteVotes> {
    const [valides, invalides] = await Promise.all([
      this.voteRepo.count({
        where: { affirmation: { id: affirmationId }, valide: true },
      }),
      this.voteRepo.count({
        where: { affirmation: { id: affirmationId }, valide: false },
      }),
    ]);
    return { affirmationId, valides, invalides };
  }
}
