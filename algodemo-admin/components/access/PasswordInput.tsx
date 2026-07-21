"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/cn";

interface PasswordInputProps {
  id: string;
  name: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  hasError?: boolean;
  describedBy?: string;
}

/**
 * Champ mot de passe avec bascule d'affichage.
 *
 * Le bouton porte un libellé explicite pour les lecteurs d'écran : une icône
 * seule ne dit pas si l'action va révéler ou masquer la saisie.
 */
export function PasswordInput({
  id,
  name,
  placeholder = "••••••••",
  value,
  onValueChange,
  hasError = false,
  describedBy,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Lock
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
        aria-hidden
      />
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onValueChange?.(event.target.value)}
        autoComplete="current-password"
        aria-invalid={hasError}
        aria-describedby={describedBy}
        className={cn(
          "h-12 w-full rounded-lg bg-surface-raised pl-11 pr-12 text-[14px] text-ink",
          "ring-1 transition-shadow placeholder:text-ink-subtle",
          "focus:outline-none focus-visible:ring-2",
          hasError
            ? "ring-danger focus-visible:ring-danger"
            : "ring-line-soft focus-visible:ring-primary-medium"
        )}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-ink-subtle transition-colors hover:text-ink"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
