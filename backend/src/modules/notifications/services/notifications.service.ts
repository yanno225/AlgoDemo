import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../auth/services/users.service';
import { RegisterDeviceTokenDto } from '../dto/register-device-token.dto';
import { DeviceToken } from '../entities/device-token.entity';
import { Notification } from '../entities/notification.entity';
import { TypeNotification } from '../enums/type-notification.enum';
import { PushService } from './push.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepo: Repository<DeviceToken>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly usersService: UsersService,
    private readonly pushService: PushService,
  ) {}

  /** Enregistrement des tokens d'appareil (§3.9) — upsert par token */
  async enregistrerToken(userId: string, dto: RegisterDeviceTokenDto): Promise<DeviceToken> {
    const existant = await this.deviceTokenRepo.findOneBy({ token: dto.token });
    if (existant) {
      existant.userId = userId;
      existant.plateforme = dto.plateforme;
      return this.deviceTokenRepo.save(existant);
    }
    return this.deviceTokenRepo.save(
      this.deviceTokenRepo.create({ userId, token: dto.token, plateforme: dto.plateforme }),
    );
  }

  async supprimerToken(userId: string, token: string): Promise<void> {
    const deviceToken = await this.deviceTokenRepo.findOneBy({ token });
    if (!deviceToken || deviceToken.userId !== userId) {
      return; // idempotent — rien à supprimer pour cet utilisateur
    }
    await this.deviceTokenRepo.remove(deviceToken);
  }

  mesNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({ where: { userId }, order: { creeLe: 'DESC' } });
  }

  async marquerLue(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOneBy({ id: notificationId });
    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} introuvable`);
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException("Cette notification n'appartient pas à l'utilisateur courant");
    }
    notification.lue = true;
    return this.notificationRepo.save(notification);
  }

  async marquerToutesLues(userId: string): Promise<void> {
    await this.notificationRepo.update({ userId, lue: false }, { lue: true });
  }

  /**
   * Point d'entrée commun des listeners `notif.*` : filtre par consentement RGPD
   * (`UsersService.findIdsConsentants`), persiste une notification par destinataire
   * puis déclenche le push. `userIds` omis = diffusion à tous les comptes consentants.
   */
  async notifier(
    type: TypeNotification,
    titre: string,
    corps: string,
    userIds: string[] | undefined,
    donnees?: Record<string, unknown>,
  ): Promise<void> {
    const destinataires = await this.usersService.findIdsConsentants(userIds);
    for (const userId of destinataires) {
      await this.notificationRepo.save(
        this.notificationRepo.create({ userId, type, titre, corps, donnees }),
      );
      await this.pushService.envoyer(userId, titre, corps);
    }
  }
}
