import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { UserStatsService } from './services/user-stats.service';
import { BloquerCompteDto } from './dto/bloquer-compte.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { ValiderCompteDto } from './dto/valider-compte.dto';
import { UsersService } from './services/users.service';

/**
 * Gestion administrateur des comptes (§9.3) : validation, blocage,
 * attribution/certification des points focaux.
 */
@ApiTags('Auth — Administration des comptes')
@ApiBearerAuth()
@Controller('auth/users')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class UsersAdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly statsService: UserStatsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'ADMIN — liste des comptes' })
  async findAll(): Promise<UserProfileDto[]> {
    const users = await this.usersService.findAll();
    return users.map((u) => UserProfileDto.depuis(u));
  }

  // Déclarée AVANT les routes ':id/…' pour ne pas être lue comme un UUID.
  @Get('moi/statistiques')
  @Roles(Role.UTILISATEUR, Role.POINT_FOCAL, Role.ADMIN)
  @ApiOperation({
    summary:
      "Mes compteurs d'activité réels — ce que le profil de l'application affiche",
  })
  mesStatistiques(@CurrentUser() user: AuthUser) {
    return this.statsService.statistiquesUtilisateur(user.id);
  }

  @Get('moi/historique')
  @Roles(Role.UTILISATEUR, Role.POINT_FOCAL, Role.ADMIN)
  @ApiOperation({
    summary:
      "Mon historique d'activité chronologique (100 derniers événements, sans les choix de vote)",
  })
  monHistorique(@CurrentUser() user: AuthUser) {
    return this.statsService.historiqueActivite(user.id);
  }

  @Get('moi/donnees')
  @Roles(Role.UTILISATEUR, Role.POINT_FOCAL, Role.ADMIN)
  @ApiOperation({
    summary:
      'Export complet de mes données (portabilité RGPD art. 20) — JSON en clair, hors bulletins de vote (anonymes par construction)',
  })
  mesDonnees(@CurrentUser() user: AuthUser) {
    return this.statsService.exportDonnees(user.id);
  }

  @Patch(':id/valider')
  @ApiOperation({ summary: 'ADMIN — valide (ou invalide) un compte' })
  async valider(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ValiderCompteDto,
    @CurrentUser() admin: AuthUser,
  ): Promise<UserProfileDto> {
    const user = await this.usersService.valider(id, dto.valide, admin.id);
    return UserProfileDto.depuis(user);
  }

  @Patch(':id/bloquer')
  @ApiOperation({ summary: 'ADMIN — bloque (ou débloque) un compte' })
  async bloquer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BloquerCompteDto,
    @CurrentUser() admin: AuthUser,
  ): Promise<UserProfileDto> {
    const user = await this.usersService.bloquer(id, dto.bloque, admin.id);
    return UserProfileDto.depuis(user);
  }

  @Patch(':id/role')
  @ApiOperation({
    summary: 'ADMIN — change le rôle du compte (attribution/certification point focal)',
  })
  async changerRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeRoleDto,
    @CurrentUser() admin: AuthUser,
  ): Promise<UserProfileDto> {
    const user = await this.usersService.changerRole(id, dto.role, admin.id);
    return UserProfileDto.depuis(user);
  }

  @Get(':id/historique')
  @ApiOperation({
    summary:
      'ADMIN — décisions administratives prises sur ce compte (certifications, validations, blocages)',
  })
  historique(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.historique(id);
  }

  @Get(':id/statistiques')
  @ApiOperation({
    summary:
      "ADMIN — activité citoyenne du compte (avis, votes, débats, signalements)",
  })
  statistiques(@Param('id', ParseUUIDPipe) id: string) {
    return this.statsService.statistiquesUtilisateur(id);
  }
}
