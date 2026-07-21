"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { THEMATICS, type ThematicId } from "@/lib/domain/thematics";
import { cn } from "@/lib/cn";

interface ThematicPickerProps {
  name: string;
  /** Autorise plusieurs thématiques — cas des consultations (RG-CON-02). */
  multiple?: boolean;
  defaultValue?: ThematicId[];
}

/**
 * Sélecteur des 5 thématiques fixes (RG-THE-01).
 *
 * La liste est fermée par construction : elle est lue depuis `THEMATICS` et
 * ne peut pas être étendue depuis l'interface, conformément à la règle
 * interdisant toute modification sans accord du comité de pilotage.
 */
export function ThematicPicker({
  name,
  multiple = false,
  defaultValue = [],
}: ThematicPickerProps) {
  const [selected, setSelected] = useState<ThematicId[]>(defaultValue);

  const toggle = (id: ThematicId) => {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      return multiple ? [...current, id] : [id];
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {THEMATICS.map((thematic) => {
        const active = selected.includes(thematic.id);

        return (
          <button
            key={thematic.id}
            type="button"
            onClick={() => toggle(thematic.id)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] transition-all duration-150 active:scale-[0.97]",
              active
                ? "bg-primary font-bold text-ink-inverse shadow-sm"
                : "bg-surface-raised font-medium text-ink-muted ring-1 ring-line-soft hover:text-ink"
            )}
          >
            {active && <Check className="size-3.5" aria-hidden />}
            {thematic.label}
          </button>
        );
      })}

      {/* Valeurs transmises à la soumission du formulaire. */}
      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}
