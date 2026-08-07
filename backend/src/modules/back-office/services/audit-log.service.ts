import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../common/enums/role.enum';
import { AuditLog } from '../entities/audit-log.entity';

export interface EntreeAudit {
  userId: string;
  role: Role;
  methode: string;
  route: string;
  statutHttp: number;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  /** Ne doit jamais faire échouer la requête d'origine — erreurs journalisées seulement */
  async enregistrer(entree: EntreeAudit): Promise<void> {
    try {
      await this.auditLogRepo.save(this.auditLogRepo.create(entree));
    } catch (e) {
      this.logger.error("Échec de l'écriture du journal d'audit", e instanceof Error ? e.stack : String(e));
    }
  }

  findRecents(limite = 100): Promise<AuditLog[]> {
    return this.auditLogRepo.find({ order: { creeLe: 'DESC' }, take: limite });
  }
}
