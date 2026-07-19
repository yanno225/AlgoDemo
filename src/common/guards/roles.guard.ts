import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

/**
 * ⚠️⚠️⚠️ GUARD PROVISOIRE — À REMPLACER PAR LE GUARD JWT (Dev A) ⚠️⚠️⚠️
 *
 * En attendant le module Auth réel, ce guard lit le rôle depuis l'en-tête
 * HTTP "X-Debug-Role" afin de pouvoir développer et tester les routes
 * protégées (ex. CRUD admin du référentiel).
 *
 *   Exemple : curl -X POST ... -H "X-Debug-Role: ADMIN"
 *
 * Contrat à respecter lors du remplacement (pour ne PAS toucher aux contrôleurs) :
 *  - lire les rôles requis via la métadonnée ROLES_KEY (décorateur @Roles) ;
 *  - une route sans @Roles reste publique ;
 *  - déposer l'utilisateur authentifié sur request.user ({ role: Role, ... }).
 *
 * ⛔ NE JAMAIS DÉPLOYER CE GUARD EN PRODUCTION.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Pas de @Roles sur la route → accès public (ex. routes GET du référentiel)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const debugRole = request.headers['x-debug-role'];

    if (!debugRole || Array.isArray(debugRole)) {
      throw new UnauthorizedException(
        "En-tête X-Debug-Role manquant (guard provisoire — sera remplacé par l'authentification JWT)",
      );
    }

    if (!Object.values(Role).includes(debugRole as Role)) {
      throw new ForbiddenException(
        `Rôle inconnu "${debugRole}". Valeurs acceptées : ${Object.values(Role).join(', ')}`,
      );
    }

    // Simule le request.user que déposera le futur guard JWT
    (request as Request & { user: { role: Role } }).user = {
      role: debugRole as Role,
    };

    const autorise = requiredRoles.includes(debugRole as Role);
    if (!autorise) {
      this.logger.warn(
        `Accès refusé : rôle ${debugRole} — requis : ${requiredRoles.join(', ')}`,
      );
    }
    return autorise;
  }
}
