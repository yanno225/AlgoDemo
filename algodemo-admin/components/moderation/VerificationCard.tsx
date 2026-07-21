import Link from "next/link";
import {
  Sparkles,
  BadgeCheck,
  Search,
  TriangleAlert,
  Loader,
  ArrowRight,
} from "lucide-react";
import type { TriangulationOrigin, VerificationItem } from "@/lib/domain/types";
import { formatNumber } from "@/lib/format";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

const ORIGIN_META: Record<
  TriangulationOrigin,
  { label: string; icon: typeof Sparkles; tone: BadgeTone }
> = {
  ai: { label: "Source ouverte IA", icon: Sparkles, tone: "info" },
  point_focal: { label: "Point focal certifié", icon: BadgeCheck, tone: "success" },
  investigation: { label: "Investigation", icon: Search, tone: "danger" },
};

/**
 * État global d'un dossier, déduit de ses trois étapes.
 *
 * L'étape bloquante prime sur tout le reste : un dossier dont une étape est
 * en alerte ne doit jamais paraître « en bonne voie » parce que les deux
 * autres sont vertes.
 */
function resolveState(steps: VerificationItem["steps"]) {
  const statuses = steps.map((step) => step.status);

  if (statuses.includes("blocked")) {
    return {
      tone: "danger" as const,
      icon: TriangleAlert,
      action: "Ouvrir l'investigation",
      actionable: true,
    };
  }
  if (statuses.every((status) => status === "validated" || status === "success")) {
    return {
      tone: "success" as const,
      icon: BadgeCheck,
      action: "Valider pour publication",
      actionable: true,
    };
  }
  if (statuses[0] === "pending") {
    return {
      tone: "neutral" as const,
      icon: Loader,
      action: "En attente d'analyse",
      actionable: false,
    };
  }
  return {
    tone: "info" as const,
    icon: Sparkles,
    action: "Étape suivante",
    actionable: true,
  };
}

const STATE_SURFACES: Record<string, string> = {
  danger: "bg-danger-pale ring-danger/25",
  success: "bg-primary-pale ring-primary/20",
  info: "bg-secondary-pale ring-secondary/25",
  neutral: "bg-surface-raised ring-line-soft",
};

interface VerificationCardProps {
  item: VerificationItem;
  index?: number;
}

/** Dossier de triangulation (RG-FEED-01) dans la file de vérification. */
export function VerificationCard({ item, index = 0 }: VerificationCardProps) {
  const origin = ORIGIN_META[item.origin];
  const state = resolveState(item.steps);
  const OriginIcon = origin.icon;
  const StateIcon = state.icon;

  return (
    <article
      className="animate-rise rounded-xl bg-surface p-5 shadow-sm ring-1 ring-hairline"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold leading-snug text-ink">{item.title}</h3>
          <p className="mt-1 text-[12px] text-ink-subtle">
            {item.reference} · {formatNumber(item.shares)} partages
          </p>
        </div>

        <Badge tone={origin.tone}>
          <OriginIcon className="size-3" aria-hidden />
          {origin.label}
        </Badge>
      </header>

      {item.priority === "high" && (
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-danger">
          Priorité haute
        </p>
      )}

      <div
        className={cn(
          "mt-3 rounded-lg p-4 ring-1",
          STATE_SURFACES[state.tone] ?? STATE_SURFACES.neutral
        )}
      >
        <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-ink-muted">
          <StateIcon className="size-3.5" aria-hidden />
          {item.headline}
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink">{item.summary}</p>
      </div>

      {state.actionable ? (
        <Link
          href={`/moderation/verifications/${item.id}`}
          className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border-[1.5px] border-primary px-4 text-[14px] font-semibold text-primary transition-colors hover:bg-primary-pale"
        >
          {state.action}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      ) : (
        <p className="mt-4 flex h-9 w-full items-center justify-center rounded-md bg-surface-raised text-[14px] font-medium text-ink-subtle">
          {state.action}
        </p>
      )}
    </article>
  );
}
