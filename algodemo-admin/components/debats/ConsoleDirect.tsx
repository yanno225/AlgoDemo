"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { io, type Socket } from "socket.io-client";
import {
  CheckCircle2,
  Flag,
  ListChecks,
  Lock,
  Send,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import type { DebatAdmin, SignalementAdmin } from "@/lib/data/debats";
import {
  creerAffirmation,
  fermerAffirmation,
  traiterSignalement,
} from "@/lib/data/debats-actions";
import { formatRelative, formatTime } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";
import { cn } from "@/lib/cn";

/**
 * Console temps réel d'un direct — la même salle socket.io que l'application
 * mobile (namespace `/debats`), vue côté staff : fil de discussion modérable,
 * affirmations soumises au vote avec décomptes vivants, signalements des
 * citoyens qui tombent en direct.
 *
 * Les écritures « lourdes » (créer/fermer une affirmation, traiter un
 * signalement) passent par les Server Actions — droits revérifiés serveur —
 * et la salle socket répercute le changement sur tous les écrans, console
 * comprise. Le chat et sa modération passent directement par la socket.
 */

interface MessageDirect {
  id: string;
  auteur: string;
  certifie: boolean;
  texte: string;
  creeLe: string;
}

interface AffirmationDirect {
  id: string;
  texte: string;
  statut: "OUVERTE" | "FERMEE";
  valides: number;
  invalides: number;
}

type EtatSalle = "connexion" | "en-salle" | "clos" | "erreur";

export function ConsoleDirect({
  debat,
  jeton,
  urlApi,
  signalementsInitiaux,
}: {
  debat: DebatAdmin;
  /** Jeton d'accès de l'admin connecté — sert uniquement au handshake socket. */
  jeton: string;
  urlApi: string;
  signalementsInitiaux: SignalementAdmin[];
}) {
  const [etat, setEtat] = useState<EtatSalle>("connexion");
  const [participants, setParticipants] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageDirect[]>([]);
  const [affirmations, setAffirmations] = useState<AffirmationDirect[]>([]);
  const [signalements, setSignalements] =
    useState<SignalementAdmin[]>(signalementsInitiaux);

  const [brouillon, setBrouillon] = useState("");
  const [texteAffirmation, setTexteAffirmation] = useState("");
  /** Suppression en deux temps : premier clic arme, second confirme. */
  const [suppressionArmee, setSuppressionArmee] = useState<string | null>(null);

  const [enCours, startTransition] = useTransition();
  const socketRef = useRef<Socket | null>(null);
  const filRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io(`${urlApi}/debats`, {
      auth: { token: jeton },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit(
        "rejoindre",
        { debatId: debat.id },
        (ack: {
          ok: boolean;
          message?: string;
          affirmations?: AffirmationDirect[];
          messages?: MessageDirect[];
        }) => {
          if (ack?.ok) {
            setAffirmations(ack.affirmations ?? []);
            setMessages(ack.messages ?? []);
            setEtat("en-salle");
          } else {
            setEtat(ack?.message?.includes("TERMINE") ? "clos" : "erreur");
          }
        },
      );
    });

    socket.on("participants.maj", ({ nombre }: { nombre: number }) =>
      setParticipants(nombre),
    );

    socket.on("message.nouveau", (message: MessageDirect) =>
      setMessages((courants) =>
        courants.some((m) => m.id === message.id)
          ? courants
          : [...courants, message],
      ),
    );

    socket.on("message.supprime", ({ messageId }: { messageId: string }) =>
      setMessages((courants) => courants.filter((m) => m.id !== messageId)),
    );

    socket.on(
      "affirmation.nouvelle",
      ({ id, texte }: { id: string; texte: string }) =>
        setAffirmations((courantes) =>
          courantes.some((a) => a.id === id)
            ? courantes
            : [...courantes, { id, texte, statut: "OUVERTE", valides: 0, invalides: 0 }],
        ),
    );

    const majDecompte =
      (fermer: boolean) =>
      (decompte: { affirmationId: string; valides: number; invalides: number }) =>
        setAffirmations((courantes) =>
          courantes.map((a) =>
            a.id === decompte.affirmationId
              ? {
                  ...a,
                  valides: decompte.valides,
                  invalides: decompte.invalides,
                  statut: fermer ? "FERMEE" : a.statut,
                }
              : a,
          ),
        );
    socket.on("vote.maj", majDecompte(false));
    socket.on("affirmation.fermee", majDecompte(true));

    socket.on(
      "signalement.nouveau",
      (s: { id: string; message: string; de: string; recuLe: string }) =>
        setSignalements((courants) =>
          courants.some((x) => x.id === s.id)
            ? courants
            : [
                { id: s.id, message: s.message, statut: "EN_ATTENTE", creeLe: s.recuLe },
                ...courants,
              ],
        ),
    );

    socket.on("debat.cloture", ({ debatId }: { debatId: string }) => {
      if (debatId === debat.id) setEtat("clos");
    });

    socket.on("connect_error", () =>
      setEtat((courant) => (courant === "en-salle" ? courant : "erreur")),
    );

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [debat.id, jeton, urlApi]);

  // Le fil suit la conversation.
  useEffect(() => {
    filRef.current?.scrollTo({ top: filRef.current.scrollHeight });
  }, [messages.length]);

  // Le désarmement automatique évite une suppression armée oubliée.
  useEffect(() => {
    if (!suppressionArmee) return;
    const timer = setTimeout(() => setSuppressionArmee(null), 4000);
    return () => clearTimeout(timer);
  }, [suppressionArmee]);

  const envoyerMessage = useCallback(() => {
    const texte = brouillon.trim();
    if (!texte) return;
    socketRef.current?.emit("message", { debatId: debat.id, texte });
    setBrouillon("");
  }, [brouillon, debat.id]);

  const supprimerMessage = useCallback(
    (messageId: string) => {
      if (suppressionArmee !== messageId) {
        setSuppressionArmee(messageId);
        return;
      }
      socketRef.current?.emit("message.supprimer", { messageId });
      setSuppressionArmee(null);
    },
    [suppressionArmee],
  );

  const soumettreAffirmation = () => {
    const texte = texteAffirmation.trim();
    if (!texte) return;
    startTransition(async () => {
      const donnees = new FormData();
      donnees.set("debatId", debat.id);
      donnees.set("texte", texte);
      await creerAffirmation(donnees);
      // L'ajout à la liste arrive par la diffusion `affirmation.nouvelle`.
      setTexteAffirmation("");
    });
  };

  const fermerVote = (affirmationId: string) =>
    startTransition(async () => {
      const donnees = new FormData();
      donnees.set("affirmationId", affirmationId);
      await fermerAffirmation(donnees);
      // Le passage en FERMEE arrive par la diffusion `affirmation.fermee`.
    });

  const traiter = (signalementId: string) =>
    startTransition(async () => {
      const donnees = new FormData();
      donnees.set("signalementId", signalementId);
      await traiterSignalement(donnees);
      setSignalements((courants) =>
        courants.map((s) =>
          s.id === signalementId ? { ...s, statut: "TRAITE" } : s,
        ),
      );
    });

  const enSalle = etat === "en-salle";
  const enAttente = signalements.filter((s) => s.statut === "EN_ATTENTE");

  return (
    <div className="grid items-start gap-5 xl:grid-cols-3">
      {/* ─── Fil de discussion ─────────────────────────────────────── */}
      <Card flush className="xl:col-span-2">
        <div className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
          <div className="flex items-center gap-2.5">
            {enSalle ? <StatusDot pulse /> : <StatusDot />}
            <h2 className="font-heading text-[16px] font-bold text-ink">
              Fil de discussion
            </h2>
            <span className="tabular text-[13px] text-ink-subtle">
              {messages.length} message{messages.length > 1 ? "s" : ""}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-raised px-3 py-1 text-[13px] font-semibold text-ink-muted ring-1 ring-hairline">
            <Users className="size-3.5" aria-hidden />
            {participants ?? "—"} dans la salle
          </span>
        </div>

        <div ref={filRef} className="h-[480px] overflow-y-auto px-5 py-4">
          {etat === "connexion" && (
            <p className="py-10 text-center text-[14px] text-ink-muted">
              Connexion à la salle…
            </p>
          )}
          {etat === "erreur" && (
            <p className="py-10 text-center text-[14px] text-ink-muted">
              Impossible de rejoindre la salle. Vérifiez que le backend tourne,
              puis rechargez la page.
            </p>
          )}
          {etat === "clos" && (
            <p className="py-10 text-center text-[14px] text-ink-muted">
              Ce direct est clôturé — le fil est figé.
            </p>
          )}

          {enSalle && messages.length === 0 && (
            <p className="py-10 text-center text-[14px] text-ink-muted">
              Aucun message pour l&apos;instant.
            </p>
          )}

          <ul className="space-y-1">
            {messages.map((message) => (
              <li
                key={message.id}
                className={cn(
                  "group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  message.certifie ? "bg-primary-pale/60" : "hover:bg-surface-raised",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                    message.certifie
                      ? "bg-primary text-ink-inverse"
                      : "bg-surface-raised text-ink-muted ring-1 ring-hairline",
                  )}
                >
                  {message.certifie ? (
                    <ShieldCheck className="size-4" aria-hidden />
                  ) : (
                    message.auteur
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((mot) => mot[0]?.toUpperCase())
                      .join("")
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        "text-[13px] font-bold",
                        message.certifie ? "text-primary" : "text-ink",
                      )}
                    >
                      {message.auteur}
                    </span>
                    {message.certifie && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-primary/70">
                        Certifié
                      </span>
                    )}
                    <span className="ml-auto shrink-0 text-[11px] text-ink-subtle">
                      {formatTime(message.creeLe)}
                    </span>
                  </p>
                  <p className="text-[14px] leading-snug text-ink-muted">
                    {message.texte}
                  </p>
                </div>

                {enSalle && (
                  <button
                    type="button"
                    onClick={() => supprimerMessage(message.id)}
                    className={cn(
                      "shrink-0 rounded-md p-1.5 transition-all",
                      suppressionArmee === message.id
                        ? "bg-danger text-ink-inverse"
                        : "text-ink-subtle opacity-0 hover:bg-danger-pale hover:text-danger group-hover:opacity-100",
                    )}
                    title={
                      suppressionArmee === message.id
                        ? "Cliquer à nouveau pour supprimer"
                        : "Supprimer ce message pour toute la salle"
                    }
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-line-soft p-4">
          <div className="flex items-center gap-2">
            <input
              value={brouillon}
              onChange={(e) => setBrouillon(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && envoyerMessage()}
              disabled={!enSalle}
              maxLength={500}
              placeholder={
                enSalle
                  ? "Écrire à la salle (message certifié)…"
                  : "Le fil est indisponible"
              }
              className="h-11 flex-1 rounded-full bg-surface-raised px-4 text-[14px] text-ink outline-none ring-1 ring-hairline transition-shadow placeholder:text-ink-subtle focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            />
            <Button
              onClick={envoyerMessage}
              disabled={!enSalle || !brouillon.trim()}
              icon={<Send className="size-4" />}
              className="rounded-full"
            >
              Envoyer
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        {/* ─── Affirmations au vote ────────────────────────────────── */}
        <Card>
          <CardHeader
            title="Affirmations au vote"
            description="La salle valide ou invalide chaque affirmation en direct."
          />

          <div className="mt-4 flex items-center gap-2">
            <input
              value={texteAffirmation}
              onChange={(e) => setTexteAffirmation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && soumettreAffirmation()}
              disabled={!enSalle || enCours}
              maxLength={500}
              placeholder="Énoncer une affirmation…"
              className="h-10 min-w-0 flex-1 rounded-lg bg-surface-raised px-3 text-[14px] text-ink outline-none ring-1 ring-hairline placeholder:text-ink-subtle focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            />
            <Button
              size="sm"
              onClick={soumettreAffirmation}
              disabled={!enSalle || enCours || !texteAffirmation.trim()}
              icon={<ListChecks className="size-3.5" />}
            >
              Soumettre
            </Button>
          </div>

          <ul className="mt-4 space-y-3">
            {affirmations.length === 0 && (
              <li className="rounded-lg bg-surface-raised p-3 text-center text-[13px] text-ink-muted">
                Aucune affirmation soumise pour l&apos;instant.
              </li>
            )}
            {affirmations.map((affirmation) => (
              <li
                key={affirmation.id}
                className="rounded-lg bg-surface-raised p-3 ring-1 ring-hairline"
              >
                <p className="text-[14px] font-semibold leading-snug text-ink">
                  {affirmation.texte}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="tabular inline-flex items-center gap-1 text-[13px] font-bold text-success">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    {affirmation.valides}
                  </span>
                  <span className="tabular inline-flex items-center gap-1 text-[13px] font-bold text-danger">
                    <XCircle className="size-3.5" aria-hidden />
                    {affirmation.invalides}
                  </span>
                  {affirmation.statut === "FERMEE" ? (
                    <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                      <Lock className="size-3" aria-hidden />
                      Vote clos
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fermerVote(affirmation.id)}
                      disabled={!enSalle || enCours}
                      className="ml-auto rounded-md px-2 py-1 text-[12px] font-bold text-primary transition-colors hover:bg-primary-pale disabled:opacity-50"
                    >
                      Fermer le vote
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* ─── Signalements ────────────────────────────────────────── */}
        <Card>
          <CardHeader
            title="Signalements"
            description="Fausses informations signalées par la salle."
            action={
              enAttente.length > 0 ? (
                <Badge tone="warning" dot>
                  {enAttente.length} à traiter
                </Badge>
              ) : undefined
            }
          />

          <ul className="mt-4 space-y-2">
            {signalements.length === 0 && (
              <li className="rounded-lg bg-surface-raised p-3 text-center text-[13px] text-ink-muted">
                Aucun signalement — bon signe.
              </li>
            )}
            {signalements.map((signalement) => (
              <li
                key={signalement.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg p-3 ring-1 ring-hairline",
                  signalement.statut === "TRAITE"
                    ? "bg-surface-raised opacity-60"
                    : "bg-secondary-pale",
                )}
              >
                <Flag
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    signalement.statut === "TRAITE" ? "text-ink-subtle" : "text-warning",
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] leading-snug text-ink">
                    {signalement.message}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-subtle">
                    {formatRelative(signalement.creeLe)}
                  </p>
                </div>
                {signalement.statut === "EN_ATTENTE" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => traiter(signalement.id)}
                    disabled={enCours}
                  >
                    Traiter
                  </Button>
                ) : (
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                    Traité
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
