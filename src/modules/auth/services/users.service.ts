import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Role } from '../../../common/enums/role.enum';
import { User } from '../entities/user.entity';

/** Code PostgreSQL d'une violation de contrainte d'unicité */
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOneBy({ email });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`Utilisateur ${id} introuvable`);
    }
    return user;
  }

  findAll(): Promise<User[]> {
    return this.userRepo.find({ order: { creeLe: 'DESC' } });
  }

  /**
   * Identifiants des comptes actifs ayant consenti aux notifications (RGPD, §9.3).
   * Utilisé par le module Notifications pour filtrer ses envois — jamais sans ce filtre.
   * `userIds` restreint le résultat à un sous-ensemble (ex. les votants d'une consultation) ;
   * omis, renvoie tous les comptes consentants (diffusion, ex. nouveau contenu).
   */
  async findIdsConsentants(userIds?: string[]): Promise<string[]> {
    if (userIds && userIds.length === 0) {
      return [];
    }
    const qb = this.userRepo
      .createQueryBuilder('u')
      .select('u.id', 'id')
      .where('u.consentementNotifications = true')
      .andWhere('u.estBloque = false')
      .andWhere('u.anonymise = false');
    if (userIds) {
      qb.andWhere('u.id IN (:...userIds)', { userIds });
    }
    const rows = await qb.getRawMany<{ id: string }>();
    return rows.map((r) => r.id);
  }

  save(user: User): Promise<User> {
    return this.userRepo.save(user);
  }

  async creer(data: Partial<User>): Promise<User> {
    try {
      return await this.userRepo.save(this.userRepo.create(data));
    } catch (e) {
      if (
        e instanceof QueryFailedError &&
        (e as QueryFailedError & { driverError: { code?: string } })
          .driverError?.code === PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          'Un compte existe déjà avec cet email ou ce téléphone',
        );
      }
      throw e;
    }
  }

  /** ADMIN — valide ou invalide un compte (§9.3) */
  async valider(id: string, valide: boolean): Promise<User> {
    const user = await this.findById(id);
    user.compteValide = valide;
    return this.save(user);
  }

  /** ADMIN — bloque ou débloque un compte (§9.3) */
  async bloquer(id: string, bloque: boolean): Promise<User> {
    const user = await this.findById(id);
    user.estBloque = bloque;
    if (bloque) {
      user.refreshTokenHash = null;
    }
    return this.save(user);
  }

  /** ADMIN — attribution/certification point focal, changement de rôle */
  async changerRole(id: string, role: Role): Promise<User> {
    const user = await this.findById(id);
    user.role = role;
    return this.save(user);
  }

  /** Statistiques pour le dashboard back-office (§3.10) */
  async statistiques(): Promise<{ total: number; parRole: Record<Role, number> }> {
    const total = await this.userRepo.count();
    const lignes = await this.userRepo
      .createQueryBuilder('u')
      .select('u.role', 'role')
      .addSelect('COUNT(*)', 'nombre')
      .groupBy('u.role')
      .getRawMany<{ role: Role; nombre: string }>();

    const parRole = Object.fromEntries(Object.values(Role).map((r) => [r, 0])) as Record<
      Role,
      number
    >;
    for (const ligne of lignes) {
      parRole[ligne.role] = Number(ligne.nombre);
    }
    return { total, parRole };
  }
}
