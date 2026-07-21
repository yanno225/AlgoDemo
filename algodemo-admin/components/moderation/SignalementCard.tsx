import Link from "next/link";
import Image from "next/image";
import { MapPin, User, ImageOff } from "lucide-react";
import type { ModerationStatus, Signalement } from "@/lib/domain/types";
import { formatRelative } from "@/lib/format";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

/** Correspondance statut de traitement → ton visuel. */
export const STATUS_TONES: Record<ModerationStatus, BadgeTone> = {
  new: "info",
  in_progress: "warning",
  handled: "success",
  rejected: "danger",
};

export const STATUS_LABELS: Record<ModerationStatus, string> = {
  new: "Nouveau",
  in_progress: "En cours",
  handled: "Traité",
  rejected: "Rejeté",
};

interface SignalementCardProps {
  signalement: Signalement;
  index?: number;
}

/** Signalement citoyen dans la file de modération. */
export function SignalementCard({ signalement, index = 0 }: SignalementCardProps) {
  return (
    <Link
      href={`/moderation/signalements/${signalement.id}`}
      className="group animate-rise flex gap-4 rounded-xl bg-surface p-4 shadow-sm ring-1 ring-hairline transition-all duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface-raised">
        {signalement.photoUrl ? (
          <Image
            src={signalement.photoUrl}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center text-ink-subtle">
            <ImageOff className="size-5" aria-hidden />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="neutral">{signalement.tag}</Badge>
          <Badge tone={STATUS_TONES[signalement.status]} dot>
            {STATUS_LABELS[signalement.status]}
          </Badge>
        </div>

        <p className="mt-2 line-clamp-2 text-[14px] font-semibold leading-snug text-ink group-hover:text-primary">
          {signalement.description}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-subtle">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" aria-hidden />
            {signalement.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="size-3" aria-hidden />
            {signalement.reporter}
          </span>
          <span className="ml-auto">{formatRelative(signalement.reportedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
