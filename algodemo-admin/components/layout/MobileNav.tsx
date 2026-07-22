"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Scale } from "lucide-react";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/lib/navigation";
import { NAV_ICONS } from "./Sidebar";

interface MobileNavProps {
  items: NavItem[];
}

/**
 * Navigation mobile du back-office.
 *
 * Sous 1024 px, la colonne latérale disparaît : sans ce tiroir, un
 * administrateur sur tablette ou téléphone resterait enfermé sur la page
 * courante, toute la navigation ayant disparu avec elle.
 *
 * Les entrées reçues sont déjà filtrées selon le rôle — même contrat que
 * la `Sidebar`, ce composant ne décide d'aucune permission.
 */
export function MobileNav({ items }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Ouvrir la navigation"
        aria-expanded={isOpen}
        className="grid size-10 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Le voile ferme, jamais ne navigue. */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Fermer la navigation"
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
          />

          <nav
            aria-label="Navigation principale"
            className="animate-slide-in absolute inset-y-0 left-0 flex w-72 flex-col bg-rail shadow-[var(--shadow-rail)]"
          >
            <div className="flex items-center gap-3 px-5 py-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-rail-raised ring-1 ring-rail-line">
                <Scale className="size-5 text-rail-ink" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-[15px] font-bold text-rail-ink">
                  AlgoDémo
                </span>
                <span className="block text-[12px] font-medium text-rail-ink-muted">
                  Administration
                </span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fermer la navigation"
                className="grid size-9 shrink-0 place-items-center rounded-lg text-rail-ink-muted transition-colors hover:bg-white/10 hover:text-rail-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <ul className="flex-1 space-y-1.5 overflow-y-auto px-4 pb-6">
              {items.map((item) => {
                const Icon = NAV_ICONS[item.icon];
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      // Fermeture au clic : le tiroir ne doit jamais rester
                      // ouvert au-dessus de la page fraîchement chargée.
                      onClick={() => setIsOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg py-3 pl-4 pr-3",
                        "text-[14px] transition-colors duration-150",
                        active
                          ? "bg-white/10 font-bold text-rail-ink"
                          : "font-medium text-rail-ink-muted hover:bg-white/5 hover:text-rail-ink"
                      )}
                    >
                      {active && (
                        <span
                          className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-secondary"
                          aria-hidden
                        />
                      )}
                      <Icon
                        className={cn(
                          "size-[18px] shrink-0 transition-colors",
                          active ? "text-secondary" : "text-white/45 group-hover:text-white/80"
                        )}
                        aria-hidden
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
