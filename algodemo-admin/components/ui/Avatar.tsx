import { cn } from "@/lib/cn";

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
  /** Compte anonymisé : l'initiale n'a pas de sens, on affiche un cadenas. */
  anonymised?: boolean;
  className?: string;
}

const SIZES = {
  sm: "size-8 text-[12px]",
  md: "size-10 text-[14px]",
  lg: "size-16 text-[20px]",
} as const;

/** Pastille d'identité : initiales sur fond de marque. */
export function Avatar({
  firstName,
  lastName,
  size = "md",
  anonymised = false,
  className,
}: AvatarProps) {
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";

  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold",
        anonymised
          ? "bg-line-soft text-ink-subtle"
          : "bg-primary-pale text-primary",
        SIZES[size],
        className
      )}
    >
      {anonymised ? "🔒" : initials}
    </span>
  );
}
