import { cn } from "@/lib/cn";

interface SparklineProps {
  /** Série de valeurs, dans l'ordre chronologique. */
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  label: string;
  className?: string;
}

/**
 * Courbe d'activité compacte.
 *
 * Tracée à la main en SVG : une bibliothèque de graphiques pèserait cent fois
 * le poids de ce composant pour le même résultat. La courbe se dessine
 * progressivement, et un dégradé sous la ligne donne du corps sans ajouter
 * de grille ni d'axes — à cette taille, ils seraient illisibles.
 */
export function Sparkline({
  data,
  width = 240,
  height = 56,
  color = "var(--color-primary)",
  label,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  // Évite une division par zéro quand la série est plate.
  const range = max - min || 1;
  const padding = 3;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y =
      height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

  const area = `${line} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;

  const gradientId = `spark-${label.replace(/\W/g, "")}`;
  // Longueur approchée du tracé, suffisante pour amorcer l'animation.
  const pathLength = width * 1.4;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      className={cn("overflow-visible", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={area} fill={`url(#${gradientId})`} />

      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        className="animate-draw"
        style={
          {
            "--dash": pathLength,
            "--dash-target": 0,
          } as React.CSSProperties
        }
      />

      {/* Dernier point mis en évidence : c'est la valeur qui compte. */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={3.5}
        fill={color}
        stroke="var(--color-surface)"
        strokeWidth={2}
      />
    </svg>
  );
}
