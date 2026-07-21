import { cn } from "@/lib/cn";

interface GaugeProps {
  /** Valeur de 0 à 100. */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Couleur du tracé — variable CSS de la charte. */
  color?: string;
  label?: string;
  /** Décale le tracé dans une série de jauges. */
  delay?: number;
  className?: string;
}

/**
 * Anneau de progression.
 *
 * Dessiné en SVG pur : aucune bibliothèque, et le tracé se remplit depuis
 * zéro via une animation CSS sur `stroke-dashoffset` — un affichage
 * directement à la valeur finale prive l'utilisateur de la perception de
 * l'avancement.
 */
export function Gauge({
  value,
  size = 72,
  strokeWidth = 7,
  color = "var(--color-primary)",
  label,
  delay = 0,
  className,
}: GaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = circumference - (circumference * clamped) / 100;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          role="img"
          aria-label={label ? `${label} : ${clamped} %` : `${clamped} %`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={0.12}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            className="animate-draw"
            style={
              {
                // Départ à midi : sens de lecture naturel.
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
                "--dash": circumference,
                "--dash-target": target,
                animationDelay: `${delay}ms`,
              } as React.CSSProperties
            }
          />
        </svg>

        <span className="absolute inset-0 grid place-items-center">
          <span className="tabular font-heading text-[15px] font-bold text-ink">
            {clamped}%
          </span>
        </span>
      </div>

      {label && (
        <span className="max-w-24 text-center text-[12px] font-medium leading-tight text-ink-muted">
          {label}
        </span>
      )}
    </div>
  );
}
