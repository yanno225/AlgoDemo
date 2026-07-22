"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  MessagesSquare,
  Library,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { NavIcon, NavItem } from "@/lib/navigation";

/** Table d'icônes partagée avec la navigation mobile (`MobileNav`). */
export const NAV_ICONS: Record<NavIcon, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  accounts: Users,
  moderation: ShieldCheck,
  debates: MessagesSquare,
  referential: Library,
};

interface SidebarProps {
  items: NavItem[];
}

/**
 * Colonne de navigation.
 *
 * Fond vert profond : elle encadre l'application et fait respirer la zone de
 * contenu crème. Les entrées reçues sont déjà filtrées selon le rôle — ce
 * composant ne décide d'aucune permission.
 */
export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="hidden w-68 shrink-0 flex-col bg-rail shadow-[var(--shadow-rail)] lg:flex">
      <div className="flex items-center gap-3 px-5 py-7">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-rail-raised ring-1 ring-rail-line">
          <Scale className="size-5 text-rail-ink" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block font-heading text-[17px] font-bold text-rail-ink">
            AlgoDémo
          </span>
          <span className="block text-[12px] font-medium text-rail-ink-muted">
            Administration
          </span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-6" aria-label="Navigation principale">
        <ul className="space-y-1.5">
          {items.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg py-3 pl-4 pr-3",
                    "text-[14px] transition-colors duration-150",
                    active
                      ? "bg-white/10 font-bold text-rail-ink"
                      : "font-medium text-rail-ink-muted hover:bg-white/5 hover:text-rail-ink"
                  )}
                >
                  {/* Liseré doré : la seconde couleur de marque sert de repère
                      de position, plutôt que de rester purement décorative. */}
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

      <div className="border-t border-rail-line px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/35">
          Veille citoyenne
        </p>
      </div>
    </aside>
  );
}
