import Image from "next/image";
import { cn } from "@/lib/cn";

interface BrandMarkProps {
  /** Dimensions et rayon de la pastille (ex. `size-10 rounded-lg`). */
  className?: string;
  /** Côté du pictogramme en pixels, à l'intérieur de la pastille. */
  markSize?: number;
}

/**
 * Pictogramme de la Fondation de l'Innovation pour la Démocratie (FID),
 * posé sur une pastille blanche — la déclinaison officielle du logo sur
 * fond sombre ou coloré. Remplace l'ancienne balance générique.
 */
export function BrandMark({ className, markSize = 22 }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center bg-white ring-1 ring-rail-line",
        className,
      )}
    >
      <Image
        src="/brand/fid-mark.png"
        alt="Fondation de l'Innovation pour la Démocratie"
        width={markSize}
        height={markSize}
      />
    </span>
  );
}
