import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceToken } from '../entities/device-token.entity';

/**
 * Passerelle push (FCM/APNs, CDC §3.0/§3.9).
 *
 * ⚠️ Aucun fournisseur push réel n'est branché dans ce dépôt. Cette classe
 * journalise l'envoi vers les appareils enregistrés de l'utilisateur — à
 * remplacer par de vrais appels FCM/APNs avant mise en production.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepo: Repository<DeviceToken>,
  ) {}

  async envoyer(userId: string, titre: string, corps: string): Promise<void> {
    const appareils = await this.deviceTokenRepo.find({ where: { userId } });
    if (appareils.length === 0) {
      this.logger.debug(`Aucun appareil enregistré pour l'utilisateur ${userId} — push ignoré`);
      return;
    }
    this.logger.log(
      `TODO(Dev A — passerelle FCM/APNs) : push "${titre}" vers ${appareils.length} appareil(s) de l'utilisateur ${userId}`,
    );
  }
}
