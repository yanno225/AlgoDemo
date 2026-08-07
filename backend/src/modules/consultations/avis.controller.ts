import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateAvisDto } from './dto/create-avis.dto';
import { ModererAvisDto } from './dto/moderer-avis.dto';
import { QueryAvisDto } from './dto/query-avis.dto';
import { AvisService } from './services/avis.service';

const GESTIONNAIRES = [Role.POINT_FOCAL, Role.ADMIN];
const TOUS_LES_ROLES = [Role.UTILISATEUR, Role.POINT_FOCAL, Role.ADMIN];

/** Avis écrits, rattachés au Référentiel, modérés avant publication (CDC §6.2) */
@ApiTags('Avis')
@Controller('avis')
@UseGuards(RolesGuard) // Sans @Roles sur la route, l'accès reste public (lecture des avis approuvés)
export class AvisController {
  constructor(private readonly avisService: AvisService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des avis approuvés (public) — filtre ?thematiqueId' })
  findApprouves(@Query() query: QueryAvisDto) {
    return this.avisService.findApprouves(query.thematiqueId);
  }

  // ⚠️ Déclarée AVANT ':id' pour ne pas être interprétée comme un UUID
  @Get('moderation')
  @Roles(...GESTIONNAIRES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'File de modération — avis en attente (POINT_FOCAL, ADMIN)' })
  findEnAttente() {
    return this.avisService.findEnAttente();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un avis approuvé (public) — 404 si non approuvé' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.avisService.findOneApprouve(id);
  }

  @Post()
  @Roles(...TOUS_LES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soumettre un avis (passe en modération)' })
  create(@Body() dto: CreateAvisDto, @CurrentUser() user: AuthUser) {
    return this.avisService.create(dto, user.id);
  }

  @Patch(':id/moderer')
  @Roles(...GESTIONNAIRES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approuver ou rejeter un avis (POINT_FOCAL, ADMIN)' })
  moderer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModererAvisDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.avisService.moderer(id, dto, user.id);
  }
}
