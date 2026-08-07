import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ContenuPubliePayload,
  DebatDemarrePayload,
  ModerationPayload,
  NOTIF_CONTENU_PUBLIE,
  NOTIF_DEBAT_DEMARRE,
  NOTIF_MODERATION,
  NOTIF_RESULTATS_PUBLIES,
  ResultatsPubliesPayload,
} from '../events/notification.events';
import { TypeNotification } from '../enums/type-notification.enum';
import { NotificationsService } from '../services/notifications.service';

/** Écoute le contrat d'événements `notif.*` (voir events/notification.events.ts) */
@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(NOTIF_DEBAT_DEMARRE)
  async handleDebatDemarre(payload: DebatDemarrePayload): Promise<void> {
    await this.notificationsService.notifier(
      TypeNotification.DEBAT_DEMARRE,
      'Un débat démarre',
      `Le débat « ${payload.titre} » vient de démarrer.`,
      payload.userIds,
      { debatId: payload.debatId },
    );
    this.logger.log(`Notifications envoyées pour le démarrage du débat ${payload.debatId}`);
  }

  @OnEvent(NOTIF_RESULTATS_PUBLIES)
  async handleResultatsPublies(payload: ResultatsPubliesPayload): Promise<void> {
    await this.notificationsService.notifier(
      TypeNotification.RESULTATS_PUBLIES,
      'Résultats publiés',
      `Les résultats de la consultation « ${payload.titre} » sont disponibles.`,
      payload.userIds,
      { consultationId: payload.consultationId },
    );
    this.logger.log(`Notifications envoyées pour les résultats de ${payload.consultationId}`);
  }

  @OnEvent(NOTIF_CONTENU_PUBLIE)
  async handleContenuPublie(payload: ContenuPubliePayload): Promise<void> {
    await this.notificationsService.notifier(
      TypeNotification.NOUVEAU_CONTENU,
      'Nouveau contenu',
      `Nouveau contenu publié : « ${payload.titre} ».`,
      payload.userIds,
      { contenuId: payload.contenuId },
    );
    this.logger.log(`Notifications envoyées pour le contenu ${payload.contenuId}`);
  }

  @OnEvent(NOTIF_MODERATION)
  async handleModeration(payload: ModerationPayload): Promise<void> {
    const approuve = payload.decision === 'APPROUVE';
    await this.notificationsService.notifier(
      TypeNotification.MODERATION,
      approuve ? 'Votre avis a été approuvé' : 'Votre avis a été rejeté',
      approuve
        ? 'Votre avis est désormais visible publiquement.'
        : "Votre avis n'a pas été retenu après modération.",
      payload.userIds,
      { avisId: payload.avisId },
    );
    this.logger.log(`Notification de modération envoyée pour l'avis ${payload.avisId}`);
  }
}
