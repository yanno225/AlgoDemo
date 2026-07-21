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
import { CreateContenuDto } from './dto/create-contenu.dto';
import { CreateSignalementDto } from './dto/create-signalement.dto';
import { QueryFeedDto } from './dto/query-feed.dto';
import { TraiterSignalementDto } from './dto/traiter-signalement.dto';
import { UpdateContenuDto } from './dto/update-contenu.dto';
import { FeedService } from './services/feed.service';
import { SignalementsService } from './services/signalements.service';
import { TtsService } from './services/tts.service';

const GESTIONNAIRES = [Role.POINT_FOCAL, Role.ADMIN];
const TOUS_LES_ROLES = [Role.UTILISATEUR, Role.POINT_FOCAL, Role.ADMIN];

@ApiTags('Feed')
@Controller('feed')
@UseGuards(RolesGuard) // Sans @Roles sur la route, l'accès reste public (lecture du feed)
export class FeedController {
  constructor(
    private readonly feedService: FeedService,
    private readonly ttsService: TtsService,
    private readonly signalementsService: SignalementsService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Feed paginé (public) — filtres thématique/type/vérification/téléchargeable, recherche mot-clé, tri date ou pertinence (§6.2, §9.4)',
  })
  findAll(@Query() query: QueryFeedDto) {
    return this.feedService.findPublies(query);
  }

  // ⚠️ Déclarées AVANT ':id' pour ne pas être interprétées comme un UUID
  @Get('offline')
  @ApiOperation({
    summary: 'Package hors-ligne (public) — contenus publiés marqués téléchargeables (§9.4)',
  })
  offline() {
    return this.feedService.findOffline();
  }

  @Get('historique')
  @Roles(...TOUS_LES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Historique de lecture de l'utilisateur courant" })
  historique(@CurrentUser() user: AuthUser) {
    return this.feedService.historique(user.id);
  }

  @Get('signalements')
  @Roles(...GESTIONNAIRES)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'File des signalements en attente (POINT_FOCAL, ADMIN) — alimente le back-office',
  })
  signalements() {
    return this.signalementsService.findEnAttente();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un contenu avec ses médias (public)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.feedService.findOne(id);
  }

  @Post()
  @Roles(...GESTIONNAIRES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un contenu (POINT_FOCAL, ADMIN) — non publié par défaut' })
  create(@Body() dto: CreateContenuDto, @CurrentUser() user: AuthUser) {
    return this.feedService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(...GESTIONNAIRES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un contenu (POINT_FOCAL, ADMIN)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateContenuDto) {
    return this.feedService.update(id, dto);
  }

  @Patch(':id/publier')
  @Roles(...GESTIONNAIRES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publier un contenu (POINT_FOCAL, ADMIN)' })
  publier(@Param('id', ParseUUIDPipe) id: string) {
    return this.feedService.publier(id);
  }

  @Patch(':id/depublier')
  @Roles(...GESTIONNAIRES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dépublier un contenu (POINT_FOCAL, ADMIN)' })
  depublier(@Param('id', ParseUUIDPipe) id: string) {
    return this.feedService.depublier(id);
  }

  @Post(':id/audio')
  @Roles(...GESTIONNAIRES)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Génère l'audio TTS du contenu (POINT_FOCAL, ADMIN) — stub tant que le MediaService partagé n'est pas branché",
  })
  async genererAudio(@Param('id', ParseUUIDPipe) id: string) {
    const contenu = await this.feedService.findOne(id);
    const urlAudio = await this.ttsService.genererAudio(contenu.id, contenu.corps);
    return this.feedService.setUrlAudio(id, urlAudio);
  }

  @Post(':id/lu')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(...TOUS_LES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marquer un contenu comme lu (historique)' })
  marquerLu(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.feedService.marquerLu(user.id, id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un contenu (ADMIN)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.feedService.remove(id);
  }

  @Post(':id/signaler')
  @Roles(...TOUS_LES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Signaler un contenu (fausse information, contenu inapproprié...)' })
  signaler(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSignalementDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.signalementsService.signaler(id, dto, user.id);
  }

  @Patch('signalements/:id/traiter')
  @Roles(...GESTIONNAIRES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Traiter un signalement — dépublier le contenu ou ignorer (POINT_FOCAL, ADMIN)' })
  traiterSignalement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TraiterSignalementDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.signalementsService.traiter(id, dto, user.id);
  }
}
