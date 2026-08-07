import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  App,
  cert,
  initializeApp,
  ServiceAccount,
} from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { readFileSync } from 'fs';
import { In, Repository } from 'typeorm';
import { DeviceToken } from '../entities/device-token.entity';

/**
 * Passerelle push réelle via Firebase Cloud Messaging (CDC §3.0/§3.9).
 *
 * Dégradable : sans FIREBASE_SERVICE_ACCOUNT_PATH dans le .env, les push sont
 * journalisés (mode dev) — le reste des notifications (in-app) fonctionne.
 * Pour activer : créer un projet Firebase (gratuit), générer la clé de compte
 * de service (JSON) et renseigner son chemin dans le .env (voir .env.example).
 *
 * Les tokens d'appareil invalides (app désinstallée…) sont purgés au fil de
 * l'eau après chaque envoi.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private app: App | null = null;

  constructor(
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepo: Repository<DeviceToken>,
    configService: ConfigService,
  ) {
    const cheminCle = configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_PATH',
    );
    if (!cheminCle) {
      this.logger.warn(
        'Firebase non configuré (FIREBASE_SERVICE_ACCOUNT_PATH absent) — MODE DEV : les push sont journalisés, pas envoyés.',
      );
      return;
    }
    try {
      const compteService = JSON.parse(
        readFileSync(cheminCle, 'utf-8'),
      ) as ServiceAccount & { project_id?: string };
      this.app = initializeApp({
        credential: cert(compteService),
      });
      this.logger.log(
        `Firebase (FCM) configuré — projet : ${compteService.project_id ?? '?'}`,
      );
    } catch (e) {
      this.logger.error(
        `Clé Firebase illisible (${cheminCle}) — push en MODE DEV : ${e instanceof Error ? e.message : String(e)}`,
      );
      this.app = null;
    }
  }

  async envoyer(userId: string, titre: string, corps: string): Promise<void> {
    const appareils = await this.deviceTokenRepo.find({ where: { userId } });
    if (appareils.length === 0) {
      this.logger.debug(
        `Aucun appareil enregistré pour l'utilisateur ${userId} — push ignoré`,
      );
      return;
    }

    if (!this.app) {
      // MODE DEV : on trace ce qui serait parti
      this.logger.log(
        `[MODE DEV — push non envoyé] "${titre}" → ${appareils.length} appareil(s) de l'utilisateur ${userId}`,
      );
      return;
    }

    const tokens = appareils.map((a) => a.token);
    try {
      const resultat = await getMessaging(this.app).sendEachForMulticast({
        tokens,
        notification: { title: titre, body: corps },
      });

      // Purge des tokens devenus invalides (app désinstallée, token expiré)
      const invalides: string[] = [];
      resultat.responses.forEach((r, i) => {
        const code = r.error?.code ?? '';
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          invalides.push(tokens[i]);
        }
      });
      if (invalides.length > 0) {
        await this.deviceTokenRepo.delete({ token: In(invalides) });
        this.logger.log(
          `${invalides.length} token(s) d'appareil invalide(s) purgé(s)`,
        );
      }

      this.logger.log(
        `Push "${titre}" : ${resultat.successCount} envoyé(s), ${resultat.failureCount} échec(s) (utilisateur ${userId})`,
      );
    } catch (e) {
      this.logger.error(
        `Échec d'envoi push (utilisateur ${userId}) : ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
