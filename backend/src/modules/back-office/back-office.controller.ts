import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { QueryAuditDto } from './dto/query-audit.dto';
import { AuditLogService } from './services/audit-log.service';
import { DashboardService } from './services/dashboard.service';
import { ModerationService } from './services/moderation.service';

const GESTIONNAIRES = [Role.POINT_FOCAL, Role.ADMIN];

/** Back-office / modération transverse (CDC §3.10) */
@ApiTags('Back-office')
@ApiBearerAuth()
@Controller('back-office')
@UseGuards(RolesGuard)
export class BackOfficeController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly moderationService: ModerationService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get('stats')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Dashboard — stats utilisateurs, contenus, consultations, avis, signalements (ADMIN)',
  })
  stats() {
    return this.dashboardService.stats();
  }

  @Get('moderation')
  @Roles(...GESTIONNAIRES)
  @ApiOperation({
    summary:
      'File de modération unifiée : avis + contenus à vérifier + signalements (POINT_FOCAL, ADMIN)',
  })
  moderation() {
    return this.moderationService.fileUnifiee();
  }

  @Get('audit')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Journal d'audit — dernières actions mutatives (ADMIN)" })
  audit(@Query() query: QueryAuditDto) {
    return this.auditLogService.findRecents(query.limite);
  }
}
