import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "brand";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-line-soft text-ink-muted",
  success: "bg-success/12 text-success",
  warning: "bg-secondary/16 text-secondary",
  danger: "bg-danger/12 text-danger",
  info: "bg-info/12 text-info",
  brand: "bg-primary-pale text-primary",
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  /** Affiche une pastille colorée : l'état ne repose alors plus sur la seule couleur. */
  dot?: boolean;
  className?: string;
}

/**
 * Étiquette d'état.
 *
 * La pastille double l'information portée par la couleur — condition
 * d'accessibilité pour les utilisateurs daltoniens, qui ne distinguent pas
 * un fond ambre d'un fond vert.
 */
export function Badge({ children, tone = "neutral", dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-[12px] font-bold tracking-wide uppercase",
        TONES[tone],
        className
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
