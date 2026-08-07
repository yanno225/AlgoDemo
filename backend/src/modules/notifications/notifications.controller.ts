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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { NotificationsService } from './services/notifications.service';

const TOUS_LES_ROLES = [Role.UTILISATEUR, Role.POINT_FOCAL, Role.ADMIN];

/** Notifications in-app + tokens d'appareil pour le push (CDC §3.9) — toutes les routes sont personnelles */
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(RolesGuard)
@Roles(...TOUS_LES_ROLES)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('devices')
  @ApiOperation({ summary: "Enregistrer le token push de l'appareil courant" })
  enregistrerToken(@Body() dto: RegisterDeviceTokenDto, @CurrentUser() user: AuthUser) {
    return this.notificationsService.enregistrerToken(user.id, dto);
  }

  @Delete('devices/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désenregistrer un token push (déconnexion de cet appareil)' })
  supprimerToken(@Param('token') token: string, @CurrentUser() user: AuthUser) {
    return this.notificationsService.supprimerToken(user.id, token);
  }

  @Get()
  @ApiOperation({ summary: "Liste des notifications de l'utilisateur courant" })
  mesNotifications(@CurrentUser() user: AuthUser) {
    return this.notificationsService.mesNotifications(user.id);
  }

  @Patch('lues')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  marquerToutesLues(@CurrentUser() user: AuthUser) {
    return this.notificationsService.marquerToutesLues(user.id);
  }

  @Patch(':id/lue')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  marquerLue(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.notificationsService.marquerLue(user.id, id);
  }
}
