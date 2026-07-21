import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { MailService } from './mail.service';

const OTP_VALIDITE_MINUTES = 10;
const BCRYPT_ROUNDS = 10;

/**
 * Génération/vérification des codes OTP à usage unique (validation email, §9.3).
 *
 * L'envoi passe par MailService (SMTP réel). Si le SMTP n'est pas configuré
 * (.env sans SMTP_HOST), bascule en MODE DEV : le code est journalisé au lieu
 * d'être envoyé — pratique en local, interdit en production.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly mailService: MailService) {}

  async genererEtEnvoyer(destinataire: string): Promise<{
    codeHash: string;
    expireLe: Date;
  }> {
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const expireLe = new Date(Date.now() + OTP_VALIDITE_MINUTES * 60_000);

    if (this.mailService.estConfigure) {
      try {
        await this.mailService.envoyerOtp(
          destinataire,
          code,
          OTP_VALIDITE_MINUTES,
        );
        this.logger.log(`Code OTP envoyé par email à ${destinataire}`);
      } catch (e) {
        // Le code n'est jamais journalisé quand le SMTP est configuré (sécurité)
        this.logger.error(
          `Échec d'envoi de l'OTP à ${destinataire}`,
          e instanceof Error ? e.stack : String(e),
        );
        throw new ServiceUnavailableException(
          "L'envoi de l'email de validation a échoué — réessayez dans quelques instants",
        );
      }
    } else {
      // MODE DEV uniquement (SMTP_HOST absent du .env)
      this.logger.warn(
        `[MODE DEV — email non envoyé] Code OTP pour ${destinataire} : ${code} (expire dans ${OTP_VALIDITE_MINUTES} min)`,
      );
    }

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
