import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardTone = "surface" | "accent" | "brand";

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Retire le rembourrage interne — cartes dont le média touche les bords. */
  flush?: boolean;
  /** Réagit au survol : réservé aux cartes réellement cliquables. */
  interactive?: boolean;
  /** `accent` pour attirer l'attention (doré), `brand` pour un rappel métier. */
  tone?: CardTone;
  /** Réservé au décalage d'animation dans une liste en cascade. */
  style?: CSSProperties;
}

const TONES: Record<CardTone, string> = {
  surface: "bg-surface ring-hairline",
  accent: "bg-secondary-pale ring-secondary/25",
  brand: "bg-primary-pale ring-primary/15",
};

/**
 * Surface de contenu.
 *
 * L'ombre est doublée d'un filet très clair : sur fond crème, une ombre seule
 * ne suffit pas à détacher une surface blanche, et les cartes finissent par
 * se confondre avec le fond.
 */
export function Card({
  children,
  className,
  flush = false,
  interactive = false,
  tone = "surface",
  style,
}: CardProps) {
  return (
    <section
      style={style}
      className={cn(
        "rounded-xl shadow-sm ring-1",
        TONES[tone],
        !flush && "p-6",
        interactive &&
          "transition-all duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      {children}
    </section>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  /** Action alignée à droite du titre (bouton, lien). */
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <header className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="font-heading text-[17px] font-bold tracking-tight text-ink">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
