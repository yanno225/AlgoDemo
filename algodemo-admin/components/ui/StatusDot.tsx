import { cn } from "@/lib/cn";

interface StatusDotProps {
  /** Fait battre la pastille — réservé aux états réellement en cours. */
  pulse?: boolean;
  className?: string;
}

/**
 * Pastille d'état.
 *
 * Le halo qui se dilate distingue un direct d'un contenu figé, sans reposer
 * sur la seule couleur rouge.
 */
export function StatusDot({ pulse = false, className }: StatusDotProps) {
  return (
    <span className={cn("relative grid size-2 place-items-center", className)}>
      {pulse && (
        <span className="absolute size-2 animate-ping rounded-full bg-current opacity-60" />
      )}
      <span className="size-2 rounded-full bg-current" />
    </span>
  );
}
