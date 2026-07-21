import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, User, Clock, Lock } from "lucide-react";
import { getSignalement } from "@/lib/data/moderation";
import { formatDate, formatRelative, formatTime } from "@/lib/format";
import type { ModerationStatus } from "@/lib/domain/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { STATUS_LABELS, STATUS_TONES } from "@/components/moderation/SignalementCard";

const STATUS_ORDER: ModerationStatus[] = ["new", "in_progress", "handled", "rejected"];

export default async function SignalementDetailPage({
  params,
}: {
  // Next 16 : `params` est asynchrone.
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const signalement = await getSignalement(id);

  if (!signalement) notFound();

  return (
    <>
      <Link
        href="/moderation?onglet=signalements"
        className="mb-4 inline-flex items-center gap-2 text-[14px] font-medium text-ink-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour aux signalements
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{signalement.category}</Badge>
            <Badge tone={STATUS_TONES[signalement.status]} dot>
              {STATUS_LABELS[signalement.status]}
            </Badge>
          </div>
          <h1 className="mt-2 font-heading text-[28px] font-bold text-ink">
            Signalement <span className="font-mono">{signalement.reference}</span>
          </h1>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ─── Contenu du signalement ──────────────────────────────── */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <p className="text-[14px] leading-relaxed text-ink">
              {signalement.description}
            </p>

            {signalement.photoUrl && (
              <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-lg bg-surface-raised">
                <Image
                  src={signalement.photoUrl}
                  alt={`Photo du signalement ${signalement.reference}`}
                  fill
                  sizes="(min-width: 1024px) 640px, 100vw"
                  className="object-cover"
                />
              </div>
            )}

            <dl className="mt-4 grid gap-3 border-t border-line-soft pt-4 sm:grid-cols-3">
              <div>
                <dt className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-ink-subtle">
                  <MapPin className="size-3" aria-hidden />
                  Lieu
                </dt>
                <dd className="mt-1 text-[14px] text-ink">{signalement.location}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-ink-subtle">
                  <User className="size-3" aria-hidden />
                  Signalé par
                </dt>
                <dd className="mt-1 text-[14px] text-ink">{signalement.reporter}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-ink-subtle">
                  <Clock className="size-3" aria-hidden />
                  Reçu
                </dt>
                <dd className="mt-1 text-[14px] text-ink">
                  {formatDate(signalement.reportedAt)} à{" "}
                  {formatTime(signalement.reportedAt)}
                </dd>
              </div>
            </dl>
          </Card>

          {/* ─── Historique ─────────────────────────────────────────── */}
          <Card>
            <CardHeader
              title="Historique"
              description="Toute action de modération est tracée et non modifiable."
            />

            <ol className="mt-5 space-y-4">
              {signalement.history.map((entry, index) => (
                <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < signalement.history.length - 1 && (
                    <span
                      className="absolute left-[5px] top-4 h-full w-px bg-line-soft"
                      aria-hidden
                    />
                  )}
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary-pale" />
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-ink">{entry.label}</p>
                    <p className="mt-0.5 text-[12px] text-ink-subtle">
                      {formatRelative(entry.at)} · {entry.by}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        {/* ─── Traitement ──────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Statut du traitement" />

            <fieldset className="mt-4 space-y-2">
              <legend className="sr-only">Choisir le statut du signalement</legend>

              {STATUS_ORDER.map((status) => {
                const checked = status === signalement.status;
                return (
                  <label
                    key={status}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border-[1.5px] px-4 py-3 text-[14px] transition-colors ${
                      checked
                        ? "border-primary bg-primary-pale font-semibold text-primary"
                        : "border-line-soft text-ink-muted hover:border-line"
                    }`}
                  >
                    <input
                      type="radio"
                      name="statut"
                      value={status}
                      defaultChecked={checked}
                      className="size-4 accent-[var(--color-primary)]"
                    />
                    {STATUS_LABELS[status]}
                  </label>
                );
              })}
            </fieldset>

            {/* TODO(backend) : PATCH /admin/signalements/:id { status } */}
            <Button className="mt-4 w-full">Mettre à jour le statut</Button>
          </Card>

          <Card>
            <CardHeader
              title="Note interne"
              description="Visible par l'équipe d'administration uniquement."
            />

            <label className="sr-only" htmlFor="note">
              Note interne
            </label>
            <textarea
              id="note"
              rows={4}
              defaultValue={signalement.internalNote}
              placeholder="Ajouter une précision pour l'équipe technique…"
              className="mt-4 w-full resize-y rounded-lg bg-surface-raised p-3 text-[14px] text-ink placeholder:text-ink-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-medium/40"
            />

            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-subtle">
              <Lock className="size-3" aria-hidden />
              Jamais transmis au citoyen à l&apos;origine du signalement.
            </p>

            <Button variant="outline" className="mt-3 w-full">
              Enregistrer la note
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
