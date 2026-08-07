import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { RoleParticipation } from '../enums/debats.enums';

/** Jeton d'accès à la salle vidéo d'un débat + infos de connexion pour le client */
export interface LiveAccess {
  /** URL WebSocket du serveur LiveKit (le client s'y connecte) */
  url: string;
  /** Jeton JWT LiveKit — porte les permissions (publier ou regarder) */
  token: string;
  /** Nom de la salle vidéo (une par débat) */
  room: string;
  /** true si l'utilisateur peut publier caméra/micro (modérateur/intervenant) */
  peutPublier: boolean;
}

/**
 * Génère les jetons d'accès à la salle vidéo LiveKit d'un débat (contrat n°?
 * — pilotage vidéo par le backend). Le backend est le SEUL à décider qui entre
 * dans quelle salle et qui a le droit de publier son flux, selon le rôle de
 * participation (modérateur/intervenant = publient ; spectateur = regarde).
 *
 * Configuration (.env) : LIVEKIT_URL · LIVEKIT_API_KEY · LIVEKIT_API_SECRET
 * (doivent correspondre au conteneur livekit de docker-compose).
 */
@Injectable()
export class LivekitService {
  private readonly logger = new Logger(LivekitService.name);
  private readonly url: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(configService: ConfigService) {
    this.url = configService.get<string>('LIVEKIT_URL', 'ws://localhost:7880');
    this.apiKey = configService.get<string>('LIVEKIT_API_KEY', '');
    this.apiSecret = configService.get<string>('LIVEKIT_API_SECRET', '');
    if (!this.apiKey || !this.apiSecret) {
      this.logger.warn(
        'LiveKit non configuré (LIVEKIT_API_KEY/SECRET absents) — la vidéo des débats est indisponible.',
      );
    }
  }

  get estConfigure(): boolean {
    return Boolean(this.apiKey && this.apiSecret);
  }

  /** Nom déterministe de la salle vidéo d'un débat */
  roomDebat(debatId: string): string {
    return `debat-${debatId}`;
  }

  /**
   * Délivre un jeton d'accès à la salle vidéo du débat.
   * Les intervenants/modérateur peuvent publier (caméra+micro), les
   * spectateurs sont en écoute seule (canPublish=false).
   */
  async genererAcces(
    debatId: string,
    user: AuthUser,
    roleParticipation: RoleParticipation,
  ): Promise<LiveAccess> {
    if (!this.estConfigure) {
      throw new ServiceUnavailableException(
        'La vidéo en direct n’est pas configurée sur ce serveur',
      );
    }

    const peutPublier =
      roleParticipation === RoleParticipation.MODERATEUR ||
      roleParticipation === RoleParticipation.INTERVENANT;
    const room = this.roomDebat(debatId);

    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: user.id, // une identité unique par utilisateur dans la salle
      name: user.email,
      ttl: '2h',
    });
    at.addGrant({
      room,
      roomJoin: true,
      canPublish: peutPublier, // seul le staff diffuse son flux
      canSubscribe: true, // tout le monde voit/entend le direct
      canPublishData: true, // messages temps réel légers (optionnel)
    });

    return {
      url: this.url,
      token: await at.toJwt(),
      room,
      peutPublier,
    };
  }
}
