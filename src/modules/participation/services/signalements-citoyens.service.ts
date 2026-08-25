import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { CreateSignalementCitoyenDto } from '../dto/create-signalement-citoyen.dto';
import { SignalementCitoyen } from '../entities/signalement-citoyen.entity';
import { StatutSignalementCitoyen } from '../enums/signalement-citoyen.enums';

/**
 * Signalement tel que servi à la liste publique « récents dans votre
 * commune » : jamais d'identifiant d'auteur — un signalement décrit un
 * problème, pas la personne qui l'a constaté.
 */
export interface SignalementPublic {
  id: string;
  categorie: SignalementCitoyen['categorie'];
  description: string;
  adresse: string;
  urlPhoto: string | null;
  statut: StatutSignalementCitoyen;
  creeLe: Date;
}

@Injectable()
export class SignalementsCitoyensService {
  constructor(
    @InjectRepository(SignalementCitoyen)
    private readonly signalementRepo: Repository<SignalementCitoyen>,
  ) {}

  create(
    dto: CreateSignalementCitoyenDto,
    auteurId: string,
  ): Promise<SignalementCitoyen> {
    return this.signalementRepo.save(
      this.signalementRepo.create({
        auteurId,
        categorie: dto.categorie,
        description: dto.description.trim(),
        adresse: dto.adresse.trim(),
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        urlPhoto: dto.urlPhoto ?? null,
      }),
    );
  }

  /** Fil public des signalements récents — anonyme, rejetés exclus. */
  async findRecents(limite = 20): Promise<SignalementPublic[]> {
    const signalements = await this.signalementRepo
      .createQueryBuilder('signalement')
      .where('signalement.statut != :rejete', {
        rejete: StatutSignalementCitoyen.REJETE,
      })
      .orderBy('signalement.creeLe', 'DESC')
      .take(limite)
      .getMany();

    return signalements.map((signalement) => ({
      id: signalement.id,
      categorie: signalement.categorie,
      description: signalement.description,
      adresse: signalement.adresse,
      urlPhoto: signalement.urlPhoto,
      statut: signalement.statut,
      creeLe: signalement.creeLe,
    }));
  }

  /** Mes signalements, statuts compris — l'auteur suit son dossier. */
  findMiens(auteurId: string): Promise<SignalementCitoyen[]> {
    return this.signalementRepo.find({
      where: { auteurId },
      order: { creeLe: 'DESC' },
    });
  }

  /** File complète pour le back-office, du plus récent au plus ancien. */
  findTous(statut?: StatutSignalementCitoyen): Promise<SignalementCitoyen[]> {
    return this.signalementRepo.find({
      where: statut ? { statut } : {},
      order: { creeLe: 'DESC' },
    });
  }

  async changerStatut(
    id: string,
    statut: StatutSignalementCitoyen,
    user: AuthUser,
  ): Promise<SignalementCitoyen> {
    const signalement = await this.signalementRepo.findOneBy({ id });
    if (!signalement) {
      throw new NotFoundException(`Signalement ${id} introuvable`);
    }
    signalement.statut = statut;
    signalement.traiteParUserId = user.id;
    signalement.traiteLe = new Date();
    return this.signalementRepo.save(signalement);
  }
}
