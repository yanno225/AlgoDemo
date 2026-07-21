import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { Role } from '../../../common/enums/role.enum';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { RoleParticipation } from '../enums/debats.enums';
import { DecompteVotes, LiveService } from '../services/live.service';

/**
 * Salle live des débats — namespace WebSocket « /debats » (socket.io).
 *
 * Authentification : le client fournit son JWT d'accès dans le handshake
 *   io('/debats', { auth: { token: '<accessToken>' } })
 * Même secret et même payload que le RolesGuard HTTP (contrat n°1).
 *
 * Événements CLIENT → SERVEUR :
 *   rejoindre  { debatId }                  → rejoint la salle, reçoit l'état courant
 *   voter      { affirmationId, valide }    → vote valider/invalider (revote autorisé)
 *   signaler   { debatId, message }         → signale une fausse information au staff
 *
 * Événements SERVEUR → CLIENT (salle debat:{id}) :
 *   participants.maj      { nombre }
 *   debat.demarre         { debatId, titre }
 *   debat.cloture         { debatId }
 *   affirmation.nouvelle  { id, texte }
 *   vote.maj              { affirmationId, valides, invalides }
 *   affirmation.fermee    { affirmationId, valides, invalides }
 *   signalement.nouveau   { id, message, de } — salle staff uniquement
 */
@WebSocketGateway({ namespace: 'debats', cors: { origin: '*' } })
export class DebatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(DebatsGateway.name);

  @WebSocketServer()
  server!: Namespace;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly liveService: LiveService,
  ) {}

  /** Vérifie le JWT au handshake — connexion refusée sans token valide */
  handleConnection(client: Socket): void {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        client.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        throw new Error('token manquant');
      }
      const payload = this.jwtService.verify<{
        sub: string;
        email: string;
        role: Role;
      }>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      } satisfies AuthUser;
    } catch {
      client.emit('erreur', {
        message: 'Authentification requise (auth.token = accessToken JWT)',
      });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    // Met à jour le compteur de participants des salles quittées
    for (const room of client.rooms) {
      if (room.startsWith('debat:') && !room.endsWith(':staff')) {
        await this.diffuserNbParticipants(room.split(':')[1]);
      }
    }
  }

  @SubscribeMessage('rejoindre')
  async rejoindre(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { debatId?: string },
  ) {
    const user = client.data.user as AuthUser;
    try {
      const { debat, roleParticipation } = await this.liveService.rejoindre(
        body?.debatId ?? '',
        user,
      );

      await client.join(`debat:${debat.id}`);
      // Modérateur et intervenants reçoivent aussi les signalements en direct
      if (roleParticipation !== RoleParticipation.SPECTATEUR) {
        await client.join(`debat:${debat.id}:staff`);
      }
      await this.diffuserNbParticipants(debat.id);

      // État courant renvoyé au nouvel arrivant (accusé de réception socket.io)
      return {
        ok: true,
        debat: { id: debat.id, titre: debat.titre, statut: debat.statut },
        roleParticipation,
        affirmations: await this.liveService.etatDesVotes(debat.id),
      };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'Erreur' };
    }
  }

  @SubscribeMessage('voter')
  async voter(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { affirmationId?: string; valide?: boolean },
  ) {
    const user = client.data.user as AuthUser;
    try {
      const { debatId, decompte } = await this.liveService.voter(
        body?.affirmationId ?? '',
        user,
        body?.valide === true,
      );
      // Tous les écrans de la salle voient le décompte bouger en direct
      this.server.to(`debat:${debatId}`).emit('vote.maj', decompte);
      return { ok: true, decompte };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'Erreur' };
    }
  }

  @SubscribeMessage('signaler')
  async signaler(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { debatId?: string; message?: string },
  ) {
    const user = client.data.user as AuthUser;
    try {
      const signalement = await this.liveService.signaler(
        body?.debatId ?? '',
        user,
        body?.message ?? '',
      );
      // Relayé en direct au staff (modérateur + intervenants) pour vérification immédiate
      this.server.to(`debat:${body!.debatId}:staff`).emit('signalement.nouveau', {
        id: signalement.id,
        message: signalement.message,
        de: user.email,
        recuLe: signalement.creeLe,
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'Erreur' };
    }
  }

  // ------- Diffusions déclenchées par les services REST -------

  diffuserDebatDemarre(debatId: string, titre: string): void {
    this.server.emit('debat.demarre', { debatId, titre });
  }

  diffuserDebatCloture(debatId: string): void {
    this.server.to(`debat:${debatId}`).emit('debat.cloture', { debatId });
  }

  diffuserNouvelleAffirmation(debatId: string, id: string, texte: string): void {
    this.server.to(`debat:${debatId}`).emit('affirmation.nouvelle', { id, texte });
  }

  diffuserAffirmationFermee(debatId: string, decompte: DecompteVotes): void {
    this.server.to(`debat:${debatId}`).emit('affirmation.fermee', decompte);
  }

  private async diffuserNbParticipants(debatId: string): Promise<void> {
    const sockets = await this.server.in(`debat:${debatId}`).fetchSockets();
    this.server
      .to(`debat:${debatId}`)
      .emit('participants.maj', { nombre: sockets.length });
  }
}
