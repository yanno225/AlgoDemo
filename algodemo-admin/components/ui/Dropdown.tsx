"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface DropdownProps {
  /** Élément déclencheur. Reçoit l'état ouvert pour adapter son rendu. */
  trigger: (isOpen: boolean) => ReactNode;
  children: ReactNode;
  /** Libellé du déclencheur pour les lecteurs d'écran. */
  label: string;
  align?: "left" | "right";
  panelClassName?: string;
}

/**
 * Menu déroulant.
 *
 * Se ferme au clic extérieur et à la touche Échap — sans quoi un panneau
 * ouvert reste piégé à l'écran, ce qui est le défaut le plus courant des
 * menus faits maison. Le focus revient au déclencheur à la fermeture par
 * clavier, pour ne pas perdre l'utilisateur qui navigue au Tab.
 */
export function Dropdown({
  trigger,
  children,
  label,
  align = "right",
  panelClassName,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  /**
   * Ferme le panneau après une action de navigation, mais jamais pendant une
   * soumission de formulaire : démonter le `<form>` au moment du clic annule
   * l'action serveur avant qu'elle ne parte.
   */
  const handlePanelClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("form")) return;
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={label}
      >
        {trigger(isOpen)}
      </button>

      {isOpen && (
        <div
          role="menu"
          onClick={handlePanelClick}
          className={cn(
            "animate-rise absolute top-[calc(100%+8px)] z-50 rounded-xl bg-surface shadow-lg ring-1 ring-hairline",
            align === "right" ? "right-0" : "left-0",
            panelClassName
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
