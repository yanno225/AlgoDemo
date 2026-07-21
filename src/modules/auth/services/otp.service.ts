import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const OTP_VALIDITE_MINUTES = 10;
const BCRYPT_ROUNDS = 10;

/**
 * Génération/vérification des codes OTP à usage unique (validation email/SMS, §9.3).
 *
 * ⚠️ Aucun fournisseur email/SMS réel n'est branché dans ce dépôt (voir .env.example :
 * ANTHROPIC_API_KEY et consorts non configurés pour l'envoi). Le code est donc journalisé
 * au lieu d'être envoyé — à remplacer par un vrai provider (ex. le futur MediaService/
 * Notifications transverse) avant mise en production.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  async genererEtEnvoyer(destinataire: string): Promise<{
    codeHash: string;
    expireLe: Date;
  }> {
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const expireLe = new Date(Date.now() + OTP_VALIDITE_MINUTES * 60_000);

    // TODO(Dev A) : remplacer par un envoi email/SMS réel une fois le service Notifications branché
    this.logger.log(`Code OTP pour ${destinataire} : ${code} (expire dans ${OTP_VALIDITE_MINUTES} min)`);

    return { codeHash, expireLe };
  }

  async verifier(
    code: string,
    codeHash: string | null | undefined,
    expireLe: Date | null | undefined,
  ): Promise<boolean> {
    if (!codeHash || !expireLe) {
      return false;
    }
    if (expireLe.getTime() < Date.now()) {
      return false;
    }
    return bcrypt.compare(code, codeHash);
  }
}
