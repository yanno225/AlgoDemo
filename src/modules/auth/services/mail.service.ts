import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Envoi d'emails transactionnels via SMTP (nodemailer).
 *
 * Fonctionne avec n'importe quel fournisseur SMTP — configuration par
 * variables d'environnement (voir .env.example) :
 *   SMTP_HOST · SMTP_PORT · SMTP_SECURE · SMTP_USER · SMTP_PASS · SMTP_FROM
 *
 * Si SMTP_HOST n'est pas renseigné, le service se met en MODE DEV : rien
 * n'est envoyé, l'appelant journalise le code à la place (utile en local,
 * interdit en production).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly expediteur: string;

  constructor(configService: ConfigService) {
    const host = configService.get<string>('SMTP_HOST');
    this.expediteur =
      configService.get<string>('SMTP_FROM') ??
      configService.get<string>('SMTP_USER') ??
      'no-reply@algodemo.local';

    if (!host) {
      this.transporter = null;
      this.logger.warn(
        'SMTP non configuré (SMTP_HOST absent) — MODE DEV : les emails ne partent pas, les codes OTP sont journalisés. À configurer avant toute utilisation réelle.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: configService.get<number>('SMTP_PORT', 587),
      // true = TLS implicite (port 465) ; false = STARTTLS (port 587, le plus courant)
      secure: configService.get<string>('SMTP_SECURE', 'false') === 'true',
      auth: {
        user: configService.get<string>('SMTP_USER'),
        pass: configService.get<string>('SMTP_PASS'),
      },
    });
    this.logger.log(`SMTP configuré : ${host} (expéditeur : ${this.expediteur})`);
  }

  /** Vrai si un fournisseur SMTP est configuré (sinon : mode dev, codes journalisés) */
  get estConfigure(): boolean {
    return this.transporter !== null;
  }

  /** Email du code de validation d'inscription (OTP) */
  async envoyerOtp(
    destinataire: string,
    code: string,
    validiteMinutes: number,
  ): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP non configuré');
    }
    await this.transporter.sendMail({
      from: `"AlgoDémo" <${this.expediteur}>`,
      to: destinataire,
      subject: `${code} — votre code de validation AlgoDémo`,
      text:
        `Bonjour,\n\n` +
        `Votre code de validation AlgoDémo est : ${code}\n` +
        `Il expire dans ${validiteMinutes} minutes.\n\n` +
        `Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\n` +
        `— L'équipe AlgoDémo · Laboratoire Ouest-Méditerranée`,
      html:
        `<div style="font-family:sans-serif;max-width:480px;margin:auto">` +
        `<h2 style="color:#14532d">AlgoDémo</h2>` +
        `<p>Bonjour,</p>` +
        `<p>Votre code de validation est :</p>` +
        `<p style="font-size:2rem;font-weight:bold;letter-spacing:6px;background:#f4f5f7;` +
        `padding:12px 24px;border-radius:8px;text-align:center">${code}</p>` +
        `<p>Il expire dans <b>${validiteMinutes} minutes</b>.</p>` +
        `<p style="color:#6b7280;font-size:.85rem">Si vous n'êtes pas à l'origine de cette ` +
        `demande, ignorez cet email.<br>— L'équipe AlgoDémo · Laboratoire Ouest-Méditerranée</p>` +
        `</div>`,
    });
  }
}
