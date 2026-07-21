import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { AuditLogService } from '../services/audit-log.service';

const METHODES_AUDITEES = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Journal d'audit transverse (§3.0/§3.10) — appliqué globalement (voir
 * BackOfficeModule, provider APP_INTERCEPTOR). Journalise chaque requête
 * mutative effectuée par un utilisateur authentifié, quel que soit le module.
 * N'intercepte pas les échecs d'autorisation : les guards rejettent la requête
 * avant que cet intercepteur ne s'exécute.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    if (!METHODES_AUDITEES.has(request.method) || !request.user) {
      return next.handle();
    }

    const { method, originalUrl, user } = request;
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        void this.auditLogService.enregistrer({
          userId: user.id,
          role: user.role,
          methode: method,
          route: originalUrl,
          statutHttp: response.statusCode,
        });
      }),
    );
  }
}
