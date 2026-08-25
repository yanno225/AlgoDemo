import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface PanneauActionProps {
  /** Libellé du déclencheur (ex. « Renommer », « Supprimer »). */
  libelle: string;
  icone?: ReactNode;
  /** Action destructrice : déclencheur et panneau passent en rouge. */
  danger?: boolean;
  /** Contenu déplié — typiquement un formulaire d'action serveur. */
  children: ReactNode;
  className?: string;
}

/**
 * Action repliée derrière un déclencheur discret.
 *
 * `<details>` natif : accessible au clavier, fonctionnel sans JavaScript, et
 * l'état ouvert/fermé survit au re-rendu serveur. Le contenu déplié rejoue
 * l'animation `rise` pour attirer l'œil sans brutalité.
 *
 * Les suppressions y gagnent une confirmation en deux temps sans `confirm()`
 * navigateur : ouvrir le panneau EST le premier temps, le bouton du
 * formulaire le second.
 */
export function PanneauAction({
  libelle,
  icone,
  danger = false,
  children,
  className,
}: PanneauActionProps) {
  return (
    <details className={cn("group/panneau", className)}>
      <summary
        className={cn(
          "inline-flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-md px-2.5",
          "select-none text-[13px] font-semibold transition-colors",
          "[&::-webkit-details-marker]:hidden",
          danger
            ? "text-ink-subtle hover:bg-danger-pale hover:text-danger group-open/panneau:bg-danger-pale group-open/panneau:text-danger"
            : "text-ink-muted hover:bg-surface-raised hover:text-primary group-open/panneau:bg-surface-raised group-open/panneau:text-primary",
        )}
      >
        {icone}
        {libelle}
        <ChevronDown
          className="size-3 transition-transform duration-200 group-open/panneau:rotate-180"
          aria-hidden
        />
      </summary>

      <div
        className={cn(
          "animate-rise mt-2 rounded-lg p-3 ring-1",
          danger ? "bg-danger-pale ring-danger/20" : "bg-surface-raised ring-hairline",
        )}
      >
        {children}
      </div>
    </details>
  );
}
