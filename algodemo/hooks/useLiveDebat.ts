import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '../constants/api';
import { useAuthStore } from '../stores/authStore';

/**
 * Session temps réel d'un débat en direct — namespace socket.io « /debats »
 * du backend (même JWT que le REST, fourni dans le handshake).
 *
 * Le hook porte tout l'état vivant de la salle : nombre de participants,
 * affirmations soumises au vote par le modérateur, décomptes qui bougent en
 * direct, clôture. Le vote (« valider / invalider ») repasse par le même
 * canal ; revoter est autorisé, le serveur remplace le vote précédent.
 */

export interface LiveAffirmation {
  id: string;
  texte: string;
  statut: 'OUVERTE' | 'FERMEE';
  valides: number;
  invalides: number;
}

/**
 * Message du fil de discussion. Le serveur ne divulgue jamais l'id du compte
 * auteur (même règle de confidentialité que les commentaires du feed) :
 * `estMoi` est déduit localement de l'accusé de réception de l'envoi.
 */
export interface LiveMessage {
  id: string;
  auteur: string;
  certifie: boolean;
  texte: string;
  creeLe: string;
  estMoi: boolean;
}

export type RoleParticipation = 'MODERATEUR' | 'INTERVENANT' | 'SPECTATEUR';

export type RoomState =
  | 'signed-out' // pas de session : on peut regarder, pas participer
  | 'connecting'
  | 'joined'
  | 'ended' // le modérateur a clôturé le direct
  | 'error';

interface JoinAck {
  ok: boolean;
  message?: string;
  roleParticipation?: RoleParticipation;
  affirmations?: LiveAffirmation[];
  messages?: Omit<LiveMessage, 'estMoi'>[];
}

interface VoteAck {
  ok: boolean;
  decompte?: { affirmationId: string; valides: number; invalides: number };
}

interface MessageAck {
  ok: boolean;
  envoye?: Omit<LiveMessage, 'estMoi'>;
}

export function useLiveDebat(debatId: string | undefined) {
  const [state, setState] = useState<RoomState>('connecting');
  const [participants, setParticipants] = useState<number | null>(null);
  const [affirmations, setAffirmations] = useState<LiveAffirmation[]>([]);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [role, setRole] = useState<RoleParticipation | null>(null);
  /** Mon vote courant par affirmation (retour visuel immédiat). */
  const [myVotes, setMyVotes] = useState<Record<string, boolean>>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!debatId) return;

    const token = useAuthStore.getState().accessToken;
    if (!token) {
      // La lecture du direct reste possible ; voter demande un compte.
      setState('signed-out');
      return;
    }

    setState('connecting');
    const socket = io(`${API_BASE_URL}/debats`, {
      auth: { token },
      // Le long-polling est capricieux en React Native : WebSocket direct.
      transports: ['websocket'],
    });
    socketRef.current = socket;

    const majDecompte = (decompte: {
      affirmationId: string;
      valides: number;
      invalides: number;
    }) => {
      setAffirmations((current) =>
        current.map((affirmation) =>
          affirmation.id === decompte.affirmationId
            ? {
                ...affirmation,
                valides: decompte.valides,
                invalides: decompte.invalides,
              }
            : affirmation
        )
      );
    };

    socket.on('connect', () => {
      socket.emit('rejoindre', { debatId }, (ack: JoinAck) => {
        if (ack?.ok) {
          setAffirmations(ack.affirmations ?? []);
          // L'historique ne dit pas quels messages sont les miens : l'id du
          // compte auteur ne sort pas du serveur, c'est voulu.
          setMessages(
            (ack.messages ?? []).map((message) => ({ ...message, estMoi: false }))
          );
          setRole(ack.roleParticipation ?? null);
          setState('joined');
        } else {
          // Le serveur refuse notamment un débat qui n'est plus en cours.
          setState(ack?.message?.includes('TERMINE') ? 'ended' : 'error');
        }
      });
    });

    socket.on('participants.maj', ({ nombre }: { nombre: number }) => {
      setParticipants(nombre);
    });

    socket.on(
      'affirmation.nouvelle',
      ({ id, texte }: { id: string; texte: string }) => {
        setAffirmations((current) => [
          ...current,
          { id, texte, statut: 'OUVERTE', valides: 0, invalides: 0 },
        ]);
      }
    );

    socket.on('vote.maj', majDecompte);

    socket.on(
      'affirmation.fermee',
      (decompte: { affirmationId: string; valides: number; invalides: number }) => {
        setAffirmations((current) =>
          current.map((affirmation) =>
            affirmation.id === decompte.affirmationId
              ? { ...affirmation, ...decompte, statut: 'FERMEE' as const }
              : affirmation
          )
        );
      }
    );

    socket.on('message.nouveau', (nouveau: Omit<LiveMessage, 'estMoi'>) => {
      // L'auteur reçoit aussi la diffusion : son accusé de réception d'envoi
      // (qui porte le même id) marquera ensuite le message comme le sien.
      setMessages((current) =>
        current.some((message) => message.id === nouveau.id)
          ? current
          : [...current, { ...nouveau, estMoi: false }]
      );
    });

    socket.on('message.supprime', ({ messageId }: { messageId: string }) => {
      setMessages((current) =>
        current.filter((message) => message.id !== messageId)
      );
    });

    socket.on('debat.cloture', ({ debatId: closedId }: { debatId: string }) => {
      if (closedId === debatId) setState('ended');
    });

    socket.on('connect_error', () => {
      // Ne pas écraser une salle déjà rejointe pour une coupure passagère :
      // socket.io retente tout seul.
      setState((current) => (current === 'joined' ? current : 'error'));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [debatId]);

  const vote = useCallback((affirmationId: string, valide: boolean) => {
    // Retour visuel immédiat ; le décompte officiel arrive par l'accusé
    // de réception puis les diffusions `vote.maj`.
    setMyVotes((current) => ({ ...current, [affirmationId]: valide }));
    socketRef.current?.emit(
      'voter',
      { affirmationId, valide },
      (ack: VoteAck) => {
        if (ack?.ok && ack.decompte) {
          const { affirmationId: id, valides, invalides } = ack.decompte;
          setAffirmations((current) =>
            current.map((affirmation) =>
              affirmation.id === id
                ? { ...affirmation, valides, invalides }
                : affirmation
            )
          );
        }
      }
    );
  }, []);

  const sendMessage = useCallback(
    (texte: string) => {
      const propre = texte.trim();
      if (!propre) return;
      socketRef.current?.emit(
        'message',
        { debatId, texte: propre },
        (ack: MessageAck) => {
          if (!ack?.ok || !ack.envoye) return;
          const envoye = ack.envoye;
          // La diffusion à la salle a pu arriver avant l'accusé : dans ce cas
          // on marque simplement le message existant comme le mien.
          setMessages((current) =>
            current.some((message) => message.id === envoye.id)
              ? current.map((message) =>
                  message.id === envoye.id
                    ? { ...message, estMoi: true }
                    : message
                )
              : [...current, { ...envoye, estMoi: true }]
          );
        }
      );
    },
    [debatId]
  );

  /** Modération du fil, réservée au staff — le serveur revérifie le rôle. */
  const deleteMessage = useCallback((messageId: string) => {
    socketRef.current?.emit('message.supprimer', { messageId });
  }, []);

  /**
   * Signale une fausse information au staff du débat — persisté côté serveur
   * et relayé en direct aux modérateurs (console web comprise).
   */
  const report = useCallback(
    (message: string) => {
      socketRef.current?.emit('signaler', { debatId, message });
    },
    [debatId]
  );

  const isStaff = role === 'MODERATEUR' || role === 'INTERVENANT';

  return {
    state,
    participants,
    affirmations,
    messages,
    myVotes,
    isStaff,
    vote,
    sendMessage,
    deleteMessage,
    report,
  };
}
