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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ChangerStatutSignalementDto } from './dto/changer-statut-signalement.dto';
import { CreateSignalementCitoyenDto } from './dto/create-signalement-citoyen.dto';
import { StatutSignalementCitoyen } from './enums/signalement-citoyen.enums';
import { SignalementsCitoyensService } from './services/signalements-citoyens.service';

const GESTIONNAIRES = [Role.POINT_FOCAL, Role.ADMIN];
const TOUS_LES_ROLES = [Role.UTILISATEUR, Role.POINT_FOCAL, Role.ADMIN];

/** Signalements citoyens de terrain (CDC §6.1) — dépôt mobile, suivi back-office */
@ApiTags('Participation citoyenne')
@Controller('participation/signalements')
@UseGuards(RolesGuard)
export class SignalementsCitoyensController {
  constructor(
    private readonly signalementsService: SignalementsCitoyensService,
  ) {}

  @Post()
  @Roles(...TOUS_LES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déposer un signalement (photo via POST /media/upload)' })
  create(
    @Body() dto: CreateSignalementCitoyenDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.signalementsService.create(dto, user.id);
  }

  @Get('recents')
  @ApiOperation({
    summary: 'Signalements récents (public, anonyme, rejetés exclus)',
  })
  findRecents() {
    return this.signalementsService.findRecents();
  }

  @Get('miens')
  @Roles(...TOUS_LES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes signalements, avec leur statut de traitement' })
  findMiens(@CurrentUser() user: AuthUser) {
    return this.signalementsService.findMiens(user.id);
  }

  @Get()
  @Roles(...GESTIONNAIRES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'File complète (POINT_FOCAL/ADMIN) — filtre ?statut' })
  @ApiQuery({ name: 'statut', required: false, enum: StatutSignalementCitoyen })
  findTous(@Query('statut') statut?: StatutSignalementCitoyen) {
    return this.signalementsService.findTous(statut);
  }

  @Patch(':id/statut')
  @Roles(...GESTIONNAIRES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Faire évoluer le statut (reçu → en cours → résolu/rejeté)' })
  changerStatut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangerStatutSignalementDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.signalementsService.changerStatut(id, dto.statut, user);
  }
}
