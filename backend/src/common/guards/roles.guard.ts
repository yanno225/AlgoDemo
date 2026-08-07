import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { AuthUser } from '../interfaces/auth-user.interface';

/**
 * Guard RBAC — vérifie le JWT d'accès et applique le contrôle de rôle (CDC §9.3).
 *
 * Contrat (inchangé depuis la version provisoire, pour ne toucher à aucun contrôleur) :
 *  - lit les rôles requis via la métadonnée ROLES_KEY (décorateur @Roles) ;
 *  - une route sans @Roles reste publique ;
 *  - dépose l'utilisateur authentifié sur request.user ({ id, email, role }).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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
    const token = this.extraireToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentification requise (en-tête Authorization: Bearer <token>)');
    }

    let payload: { sub: string; email: string; role: Role };
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    if (!Object.values(Role).includes(payload.role)) {
      throw new ForbiddenException(`Rôle inconnu "${payload.role}"`);
    }

    (request as Request & { user: AuthUser }).user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    const autorise = requiredRoles.includes(payload.role);
    if (!autorise) {
      this.logger.warn(
        `Accès refusé : rôle ${payload.role} — requis : ${requiredRoles.join(', ')}`,
      );
    }
    return autorise;
  }

  private extraireToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header || Array.isArray(header)) {
      return undefined;
    }
    const [type, token] = header.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
