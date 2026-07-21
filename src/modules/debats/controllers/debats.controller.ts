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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { CreateDebatDto } from '../dto/create-debat.dto';
import { CreerAffirmationDto } from '../dto/creer-affirmation.dto';
import { DefinirReplayDto } from '../dto/definir-replay.dto';
import { UpdateDebatDto } from '../dto/update-debat.dto';
import { DebatsService } from '../services/debats.service';

@ApiTags('Débats & Lives')
@ApiBearerAuth() // JWT requis pour la gestion (POINT_FOCAL/ADMIN) — lectures publiques
@Controller('debats')
@UseGuards(RolesGuard)
export class DebatsController {
  constructor(private readonly debatsService: DebatsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les débats (public)' })
  @ApiQuery({
    name: 'filtre',
    required: false,
    enum: ['a-venir', 'en-cours', 'termines'],
  })
  findAll(@Query('filtre') filtre?: string) {
    return this.debatsService.findAll(filtre);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un débat + affirmations (public)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.debatsService.findOne(id);
  }

  @Post()
  @Roles(Role.POINT_FOCAL, Role.ADMIN)
  @ApiOperation({ summary: 'Planifier un débat (POINT_FOCAL/ADMIN)' })
  create(@Body() dto: CreateDebatDto) {
    return this.debatsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.POINT_FOCAL, Role.ADMIN)
  @ApiOperation({ summary: 'Modifier un débat (POINT_FOCAL/ADMIN)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDebatDto) {
    return this.debatsService.update(id, dto);
  }

  @Patch(':id/demarrer')
  @Roles(Role.POINT_FOCAL, Role.ADMIN)
  @ApiOperation({
    summary:
      'Démarrer la session live (POINT_FOCAL/ADMIN) — diffuse en WebSocket + notif.debat.demarre',
  })
  demarrer(@Param('id', ParseUUIDPipe) id: string) {
    return this.debatsService.demarrer(id);
  }

  @Patch(':id/cloturer')
  @Roles(Role.POINT_FOCAL, Role.ADMIN)
  @ApiOperation({ summary: 'Clôturer la session live (POINT_FOCAL/ADMIN)' })
  cloturer(@Param('id', ParseUUIDPipe) id: string) {
    return this.debatsService.cloturer(id);
  }

  @Patch(':id/replay')
  @Roles(Role.POINT_FOCAL, Role.ADMIN)
  @ApiOperation({ summary: 'Renseigner l’URL de replay (débat terminé)' })
  definirReplay(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DefinirReplayDto,
  ) {
    return this.debatsService.definirReplay(id, dto.urlReplay);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un débat (ADMIN)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.debatsService.remove(id);
  }

  // ------- Accès à la salle vidéo en direct -------

  @Get(':id/live-token')
  @Roles(Role.UTILISATEUR, Role.POINT_FOCAL, Role.ADMIN) // tout compte authentifié
  @ApiOperation({
    summary:
      'Jeton d’accès à la salle vidéo du débat en cours — publie (staff) ou regarde (public) selon le rôle',
  })
  obtenirAccesLive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.debatsService.obtenirAccesLive(id, user);
  }

  // ------- Affirmations mises au vote en direct -------

  @Post(':id/affirmations')
  @Roles(Role.POINT_FOCAL, Role.ADMIN)
  @ApiOperation({
    summary:
      'Soumettre une affirmation au vote de la salle (modérateur) — diffusée en direct',
  })
  creerAffirmation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreerAffirmationDto,
  ) {
    return this.debatsService.creerAffirmation(id, dto.texte);
  }

  @Patch('affirmations/:affirmationId/fermer')
  @Roles(Role.POINT_FOCAL, Role.ADMIN)
  @ApiOperation({
    summary: 'Fermer le vote d’une affirmation — décompte final diffusé en direct',
  })
  fermerAffirmation(
    @Param('affirmationId', ParseUUIDPipe) affirmationId: string,
  ) {
    return this.debatsService.fermerAffirmation(affirmationId);
  }

  // ------- Signalements en direct (modération) -------

  @Get(':id/signalements')
  @Roles(Role.POINT_FOCAL, Role.ADMIN)
  @ApiOperation({ summary: 'File des signalements du débat (POINT_FOCAL/ADMIN)' })
  findSignalements(@Param('id', ParseUUIDPipe) id: string) {
    return this.debatsService.findSignalements(id);
  }

  @Patch('signalements/:signalementId/traiter')
  @Roles(Role.POINT_FOCAL, Role.ADMIN)
  @ApiOperation({ summary: 'Marquer un signalement comme traité' })
  traiterSignalement(
    @Param('signalementId', ParseUUIDPipe) signalementId: string,
  ) {
    return this.debatsService.traiterSignalement(signalementId);
  }
}
