import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { Role } from '../../../common/enums/role.enum';
import { Debat } from '../entities/debat.entity';
import {
  DemandeParole,
  StatutDemandeParole,
} from '../entities/demande-parole.entity';
import { StatutDebat } from '../enums/debats.enums';

/** Une entrée de la file ou de la tribune, telle que servie aux clients. */
export interface EntreeParole {
  id: string;
  /** « Prénom N. » — ou « Citoyen » si le compte a été anonymisé. */
  nom: string;
  depuis: Date;
}

/** Nombre maximal de citoyens simultanés à la tribune. */
export const MAX_TRIBUNE = 2;

/**
 * Prise de parole des citoyens pendant un live (« main levée »).
 *
 * Cycle : EN_ATTENTE (main levée) → ACCORDEE (à la tribune) → TERMINEE
 * (redescendu), avec REFUSEE et ANNULEE comme sorties anticipées. Tout est
 * persisté et horodaté — c'est le journal des prises de parole d'un
 * événement public. La diffusion temps réel est l'affaire de la gateway.
 */
@Injectable()
export class ParoleService {
  constructor(
    @InjectRepository(DemandeParole)
    private readonly demandeRepo: Repository<DemandeParole>,
    @InjectRepository(Debat)
    private readonly debatRepo: Repository<Debat>,
    // Modules découplés par IDs : les noms publics se lisent en SQL direct.
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /** Le citoyen lève la main. Une seule demande vivante par débat. */
  async demander(
    debatId: string,
    user: AuthUser,
  ): Promise<{ demande: DemandeParole; nom: string }> {
    const debat = await this.debatRepo.findOne({ where: { id: debatId } });
    if (!debat) {
      throw new NotFoundException(`Débat ${debatId} introuvable`);
    }
    if (debat.statut !== StatutDebat.EN_COURS) {
      throw new BadRequestException(
        'La parole ne se demande que pendant le direct',
      );
    }

    const vivante = await this.demandeRepo.findOne({
      where: {
        debat: { id: debatId },
        userId: user.id,
        statut: In([StatutDemandeParole.EN_ATTENTE, StatutDemandeParole.ACCORDEE]),
      },
    });
    if (vivante) {
      throw new BadRequestException(
        vivante.statut === StatutDemandeParole.EN_ATTENTE
          ? 'Votre demande est déjà dans la file'
          : 'Vous êtes déjà à la tribune',
      );
    }

    const demande = await this.demandeRepo.save(
      this.demandeRepo.create({
        debat: { id: debatId } as Debat,
        userId: user.id,
        statut: StatutDemandeParole.EN_ATTENTE,
      }),
    );
    const noms = await this.nomsPublics([user.id]);
    return { demande, nom: noms.get(user.id) ?? 'Citoyen' };
  }

  /** Le citoyen retire sa main levée avant décision. */
  async annuler(debatId: string, user: AuthUser): Promise<void> {
    const demande = await this.demandeRepo.findOne({
      where: {
        debat: { id: debatId },
        userId: user.id,
        statut: StatutDemandeParole.EN_ATTENTE,
      },
    });
    if (!demande) {
      throw new BadRequestException('Aucune demande en attente à annuler');
    }
    demande.statut = StatutDemandeParole.ANNULEE;
    await this.demandeRepo.save(demande);
  }

  /** Le modérateur invite le citoyen à la tribune. */
  async accorder(
    demandeId: string,
    staff: AuthUser,
  ): Promise<{ demande: DemandeParole; debatId: string }> {
    const demande = await this.chargerDemande(demandeId);
    await this.verifierStaff(demande.debat.id, staff);
    if (demande.statut !== StatutDemandeParole.EN_ATTENTE) {
      throw new BadRequestException(
        `Cette demande n'est plus en attente (statut : ${demande.statut})`,
      );
    }

    const aLaTribune = await this.demandeRepo.count({
      where: {
        debat: { id: demande.debat.id },
        statut: StatutDemandeParole.ACCORDEE,
      },
    });
    if (aLaTribune >= MAX_TRIBUNE) {
      throw new BadRequestException(
        `La tribune est pleine (${MAX_TRIBUNE} places) — retirez un invité d'abord`,
      );
    }

    demande.statut = StatutDemandeParole.ACCORDEE;
    demande.decidePar = staff.id;
    await this.demandeRepo.save(demande);
    return { demande, debatId: demande.debat.id };
  }

  /** Le modérateur refuse la demande. */
  async refuser(
    demandeId: string,
    staff: AuthUser,
  ): Promise<{ userId: string; debatId: string }> {
    const demande = await this.chargerDemande(demandeId);
    await this.verifierStaff(demande.debat.id, staff);
    if (demande.statut !== StatutDemandeParole.EN_ATTENTE) {
      throw new BadRequestException(
        `Cette demande n'est plus en attente (statut : ${demande.statut})`,
      );
    }
    demande.statut = StatutDemandeParole.REFUSEE;
    demande.decidePar = staff.id;
    await this.demandeRepo.save(demande);
    return { userId: demande.userId, debatId: demande.debat.id };
  }

  /** Le modérateur fait redescendre un invité de la tribune (kill switch). */
  async retirer(
    demandeId: string,
    staff: AuthUser,
  ): Promise<{ userId: string; debatId: string }> {
    const demande = await this.chargerDemande(demandeId);
    await this.verifierStaff(demande.debat.id, staff);
    if (demande.statut !== StatutDemandeParole.ACCORDEE) {
      throw new BadRequestException('Cet invité n’est pas à la tribune');
    }
    demande.statut = StatutDemandeParole.TERMINEE;
    demande.decidePar = staff.id;
    await this.demandeRepo.save(demande);
    return { userId: demande.userId, debatId: demande.debat.id };
  }

  /** Le citoyen redescend de lui-même (ou décline l'invitation). */
  async redescendre(debatId: string, user: AuthUser): Promise<void> {
    const demande = await this.demandeRepo.findOne({
      where: {
        debat: { id: debatId },
        userId: user.id,
        statut: StatutDemandeParole.ACCORDEE,
      },
    });
    if (!demande) {
      throw new BadRequestException('Vous n’êtes pas à la tribune');
    }
    demande.statut = StatutDemandeParole.TERMINEE;
    demande.decidePar = user.id;
    await this.demandeRepo.save(demande);
  }

  /** File d'attente (mains levées), plus ancienne en premier. */
  file(debatId: string): Promise<EntreeParole[]> {
    return this.listerParStatut(debatId, StatutDemandeParole.EN_ATTENTE);
  }

  /** Tribune : les citoyens invités qui s'expriment en ce moment. */
  tribune(debatId: string): Promise<EntreeParole[]> {
    return this.listerParStatut(debatId, StatutDemandeParole.ACCORDEE);
  }

  /** Statut de la demande vivante du citoyen dans ce débat, s'il en a une. */
  async maDemande(
    debatId: string,
    userId: string,
  ): Promise<StatutDemandeParole | null> {
    const demande = await this.demandeRepo.findOne({
      where: {
        debat: { id: debatId },
        userId,
        statut: In([StatutDemandeParole.EN_ATTENTE, StatutDemandeParole.ACCORDEE]),
      },
    });
    return demande?.statut ?? null;
  }

  /** Clôture du débat : la file se vide, la tribune redescend. */
  async cloturer(debatId: string): Promise<void> {
    await this.demandeRepo.update(
      { debat: { id: debatId }, statut: StatutDemandeParole.EN_ATTENTE },
      { statut: StatutDemandeParole.ANNULEE },
    );
    await this.demandeRepo.update(
      { debat: { id: debatId }, statut: StatutDemandeParole.ACCORDEE },
      { statut: StatutDemandeParole.TERMINEE },
    );
  }

  // ─── Interne ────────────────────────────────────────────────────────

  private async chargerDemande(demandeId: string): Promise<DemandeParole> {
    const demande = await this.demandeRepo.findOne({
      where: { id: demandeId },
      relations: { debat: true },
    });
    if (!demande) {
      throw new NotFoundException(`Demande ${demandeId} introuvable`);
    }
    return demande;
  }

  /** Même règle de staff que `rejoindre` : modérateur désigné ou certifié. */
  private async verifierStaff(debatId: string, user: AuthUser): Promise<void> {
    const debat = await this.debatRepo.findOne({ where: { id: debatId } });
    const estStaff =
      debat?.moderateurId === user.id ||
      user.role === Role.ADMIN ||
      user.role === Role.POINT_FOCAL;
    if (!estStaff) {
      throw new ForbiddenException('Seul le staff gère les prises de parole');
    }
  }

  private async listerParStatut(
    debatId: string,
    statut: StatutDemandeParole,
  ): Promise<EntreeParole[]> {
    const demandes = await this.demandeRepo.find({
      where: { debat: { id: debatId }, statut },
      order: { majLe: 'ASC' },
    });
    if (demandes.length === 0) return [];
    const noms = await this.nomsPublics(demandes.map((d) => d.userId));
    return demandes.map((d) => ({
      id: d.id,
      nom: noms.get(d.userId) ?? 'Citoyen',
      depuis: d.statut === StatutDemandeParole.EN_ATTENTE ? d.creeLe : d.majLe,
    }));
  }

  /** « Prénom N. » — ou « Citoyen » si anonymisé (RG-USR-07 rétroactif). */
  private async nomsPublics(userIds: string[]): Promise<Map<string, string>> {
    const lignes = await this.dataSource.query<
      { id: string; prenom: string; nom: string; anonymise: boolean }[]
    >(`SELECT id, prenom, nom, anonymise FROM users WHERE id = ANY($1::uuid[])`, [
      userIds,
    ]);
    return new Map(
      lignes.map((u) => [
        u.id,
        u.anonymise
          ? 'Citoyen'
          : `${u.prenom} ${u.nom ? `${u.nom[0].toUpperCase()}.` : ''}`.trim(),
      ]),
    );
  }
}
