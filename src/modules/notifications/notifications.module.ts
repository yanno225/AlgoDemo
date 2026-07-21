import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { DeviceToken } from './entities/device-token.entity';
import { Notification } from './entities/notification.entity';
import { NotificationListener } from './listeners/notification.listener';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { PushService } from './services/push.service';

/**
 * Module Notifications (CDC §3.0/§3.9) : tokens d'appareil, notifications in-app,
 * déclenchement push. Écoute le contrat d'événements `notif.*` (voir
 * events/notification.events.ts) émis par les autres modules (Feed,
 * Consultations, et plus tard Débats côté Dev B).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceToken, Notification]),
    AuthModule, // fournit UsersService (filtrage par consentement RGPD)
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushService, NotificationListener],
})
export class NotificationsModule {}
