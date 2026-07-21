import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  Check,
  CircleAlert,
  Clock,
  Ban,
  Send,
  Share2,
} from "lucide-react";
import { getVerification } from "@/lib/data/moderation";
import type { TriangulationStepStatus } from "@/lib/domain/types";
import { formatDate, formatNumber } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const STEP_META: Record<
  TriangulationStepStatus,
  { label: string; icon: typeof Check; ring: string; dot: string; text: string }
> = {
  success: {
    label: "Succès",
    icon: Check,
    ring: "ring-success/25",
    dot: "bg-success",
    text: "text-success",
  },
  validated: {
    label: "Validé",
    icon: Check,
    ring: "ring-primary/25",
    dot: "bg-primary",
    text: "text-primary",
  },
  pending: {
    label: "En attente",
    icon: Clock,
    ring: "ring-line",
    dot: "bg-ink-subtle",
    text: "text-ink-subtle",
  },
  blocked: {
    label: "Alerte bloquante",
    icon: CircleAlert,
    ring: "ring-danger/30",
    dot: "bg-danger",
    text: "text-danger",
  },
};

export default async function VerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getVerification(id);

  if (!item) notFound();

  const isBlocked = item.steps.some((step) => step.status === "blocked");
  const isComplete = item.steps.every(
    (step) => step.status === "validated" || step.status === "success"
  );

  return (
    <>
      <Link
        href="/moderation?onglet=verification"
        className="mb-4 inline-flex items-center gap-2 text-[14px] font-medium text-ink-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour à la vérification
      </Link>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {item.priority === "high" && (
            <Badge tone="danger" dot>
              Priorité haute
            </Badge>
          )}
          <span className="font-mono text-[12px] text-ink-subtle">
            {item.reference}
          </span>
        </div>
        <h1 className="mt-2 font-heading text-[28px] font-bold text-ink">{item.title}</h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-subtle">
          <span>Posté le {formatDate(item.postedAt)}</span>
          <span className="inline-flex items-center gap-1">
            <Share2 className="size-3" aria-hidden />
            {formatNumber(item.shares)} partages
          </span>
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* ─── Contenu à vérifier ─────────────────────────────────── */}
          <Card>
            <CardHeader title="Contenu à vérifier" />
            <blockquote className="mt-4 border-l-[3px] border-secondary bg-secondary-pale p-4 text-[14px] leading-relaxed text-ink">
              {item.excerpt}
            </blockquote>
          </Card>

          {/* ─── Historique de triangulation ────────────────────────── */}
          <Card>
            <CardHeader
              title="Historique de triangulation"
              description="Les trois étapes doivent aboutir avant toute publication (RG-FEED-01)."
            />

            <ol className="mt-5 space-y-3">
              {item.steps.map((step) => {
                const meta = STEP_META[step.status];
                const StepIcon = meta.icon;

                return (
                  <li
                    key={step.step}
                    className={cn(
                      "rounded-lg bg-surface-raised p-4 ring-1",
                      meta.ring
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-full text-ink-inverse",
                          meta.dot
                        )}
                      >
                        <StepIcon className="size-4" aria-hidden />
                      </span>

                      <p className="min-w-0 flex-1 text-[14px] font-bold text-ink">
                        Étape {step.step} · {step.label}
                      </p>

                      <span
                        className={cn(
                          "shrink-0 text-[12px] font-bold uppercase tracking-wide",
                          meta.text
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <p className="mt-2 pl-10 text-[14px] leading-relaxed text-ink-muted">
                      {step.detail}
                    </p>
                    {step.by && (
                      <p className="mt-1 pl-10 text-[12px] text-ink-subtle">
                        Par {step.by}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        <div className="space-y-4">
          {/* ─── Sources ────────────────────────────────────────────── */}
          <Card>
            <CardHeader title="Sources identifiées" />

            {item.sources.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {item.sources.map((source) => (
                  <li key={source.id}>
                    <a
                      href="#"
                      className="group flex items-center gap-3 rounded-lg bg-surface-raised p-3 transition-colors hover:bg-primary-pale"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface">
                        <FileText className="size-4 text-primary" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold text-ink">
                          {source.label}
                        </span>
                        <span className="block text-[12px] text-ink-subtle">
                          {source.kind}
                        </span>
                      </span>
                      <ExternalLink
                        className="size-3.5 shrink-0 text-ink-subtle group-hover:text-primary"
                        aria-hidden
                      />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-lg bg-surface-raised p-4 text-[14px] text-ink-muted">
                Aucune source n&apos;a encore été rattachée à ce dossier.
              </p>
            )}
          </Card>

          {/* ─── Décision ───────────────────────────────────────────── */}
          <Card>
            <CardHeader title="Décision" />

            {isBlocked && (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-danger-pale p-3 text-[13px] leading-relaxed text-danger">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                Une alerte bloquante empêche la publication tant que
                l&apos;investigation n&apos;est pas close.
              </p>
            )}

            <div className="mt-4 space-y-2">
              {/* TODO(backend) : POST /admin/verifications/:id/publish */}
              <Button
                className="w-full"
                disabled={!isComplete}
                icon={<Send className="size-3.5" />}
              >
                Publier dans le feed
              </Button>

              {/* TODO(backend) : POST /admin/verifications/:id/reject */}
              <Button
                variant="outline"
                className="w-full border-danger text-danger hover:bg-danger-pale"
                icon={<Ban className="size-3.5" />}
              >
                Rejeter définitivement
              </Button>
            </div>

            {!isComplete && !isBlocked && (
              <p className="mt-3 text-[12px] leading-relaxed text-ink-subtle">
                La publication reste indisponible tant que les trois étapes de
                triangulation ne sont pas franchies.
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
