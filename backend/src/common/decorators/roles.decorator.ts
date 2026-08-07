import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

/** Clé de métadonnée lue par le RolesGuard (et par le futur guard JWT du Dev A) */
export const ROLES_KEY = 'roles';

/**
 * Restreint une route aux rôles donnés.
 * Exemple : @Roles(Role.ADMIN) sur un POST/PATCH/DELETE du référentiel.
 * Une route SANS @Roles est publique.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
