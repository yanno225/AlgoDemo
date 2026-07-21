import { cn } from "@/lib/cn";

interface ProgressBarProps {
  /** Valeur de 0 à 100. */
  value: number;
  label?: string;
  color?: string;
  /** Décale le remplissage dans une liste de jauges. */
  delay?: number;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Jauge de participation.
 *
 * Le remplissage part de zéro grâce à une animation CSS pilotée par la
 * variable `--fill` : aucun composant client n'est nécessaire pour animer
 * une simple largeur.
 */
export function ProgressBar({
  value,
  label,
  color = "var(--color-primary)",
  delay = 0,
  size = "md",
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="truncate text-[13px] text-ink-muted">{label}</span>
          <span
            className="tabular shrink-0 text-[14px] font-bold"
            style={{ color }}
          >
            {clamped}%
          </span>
        </div>
      )}

      <div
        className={cn(
          "overflow-hidden rounded-full",
          size === "sm" ? "h-1.5" : "h-2"
        )}
        style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="animate-fill h-full rounded-full"
          style={
            {
              backgroundColor: color,
              "--fill": `${clamped}%`,
              animationDelay: `${delay}ms`,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}
