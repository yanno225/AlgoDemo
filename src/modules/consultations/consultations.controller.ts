import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { QueryConsultationsDto } from './dto/query-consultations.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { VoteDto } from './dto/vote.dto';
import { ConsultationsService } from './services/consultations.service';

const GESTIONNAIRES = [Role.POINT_FOCAL, Role.ADMIN];
const TOUS_LES_ROLES = [Role.UTILISATEUR, Role.POINT_FOCAL, Role.ADMIN];

@ApiTags('Consultations')
@Controller('consultations')
@UseGuards(RolesGuard) // Sans @Roles sur la route, l'accès reste public (lecture)
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des consultations (public) — filtre ?statut=ouvertes|cloturees|toutes' })
  findAll(@Query() query: QueryConsultationsDto) {
    return this.consultationsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une consultation avec ses options de vote (public)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultationsService.findOne(id);
  }

  @Get(':id/resultats')
  @ApiOperation({
    summary: 'Résultats agrégés (public) — visibles uniquement une fois publiés par un admin',
  })
  resultats(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultationsService.resultats(id);
  }

  @Post()
  @Roles(...GESTIONNAIRES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une consultation (POINT_FOCAL, ADMIN)' })
  create(@Body() dto: CreateConsultationDto) {
    return this.consultationsService.create(dto);
  }

  @Patch(':id')
  @Roles(...GESTIONNAIRES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier une consultation (POINT_FOCAL, ADMIN) — options non modifiables' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateConsultationDto) {
    return this.consultationsService.update(id, dto);
  }

  @Patch(':id/resultats/publier')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publier les résultats agrégés (ADMIN)' })
  publierResultats(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultationsService.publierResultats(id);
  }

  @Post(':id/vote')
  @Roles(...TOUS_LES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Voter (1 vote/consultation, 2FA obligatoire — §6.3) — 403 si la 2FA du compte est désactivée',
  })
  voter(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.consultationsService.voter(id, user.id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une consultation (ADMIN)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultationsService.remove(id);
  }
}
