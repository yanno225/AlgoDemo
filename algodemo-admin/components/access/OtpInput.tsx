"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { cn } from "@/lib/cn";

interface OtpInputProps {
  name: string;
  length?: number;
}

/**
 * Saisie du code à usage unique.
 *
 * Un champ de texte transparent couvre les cases et capte réellement la
 * frappe ; les cases ne sont que l'affichage. C'est ce qui préserve le
 * collage du code et la suggestion SMS du navigateur, qu'une grille de six
 * champs indépendants casserait.
 */
export function OtpInput({ name, length = 6 }: OtpInputProps) {
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCode(event.target.value.replace(/\D/g, "").slice(0, length));
  };

  const activeIndex = Math.min(code.length, length - 1);

  return (
    <div
      className="relative"
      onClick={() => inputRef.current?.focus()}
      role="presentation"
    >
      <input
        ref={inputRef}
        name={name}
        value={code}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        aria-label={`Code de vérification à ${length} chiffres`}
        className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
      />

      <div className="flex justify-between gap-2" aria-hidden>
        {Array.from({ length }).map((_, index) => {
          const char = code[index] ?? "";
          const isActive = focused && index === activeIndex;

          return (
            <div
              key={index}
              className={cn(
                "grid h-14 flex-1 place-items-center rounded-lg text-[20px] font-bold text-ink",
                "ring-[1.5px] transition-all duration-150",
                char || isActive
                  ? "bg-surface ring-primary"
                  : "bg-surface-raised ring-line-soft"
              )}
            >
              {char || (isActive && <span className="h-5 w-px animate-pulse bg-primary" />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
