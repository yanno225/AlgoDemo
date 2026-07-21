import Link from "next/link";
import { cn } from "@/lib/cn";

export interface TabDefinition {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabDefinition[];
  activeKey: string;
  /** Construit l'URL d'un onglet — l'état vit dans l'URL, pas en mémoire. */
  hrefForTab: (key: string) => string;
  className?: string;
}

/**
 * Onglets de navigation.
 *
 * Chaque onglet est un lien véritable : l'état sélectionné est porté par
 * l'URL, donc partageable, rechargeable et compatible avec le bouton retour —
 * ce qu'un état React local ne permet pas.
 */
export function Tabs({ tabs, activeKey, hrefForTab, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex gap-1 rounded-lg bg-surface-raised p-1 ring-1 ring-line-soft",
        className
      )}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;

        return (
          <Link
            key={tab.key}
            href={hrefForTab(tab.key)}
            role="tab"
            aria-selected={active}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-[14px] transition-all duration-150",
              active
                ? "bg-surface font-bold text-primary shadow-sm"
                : "font-medium text-ink-muted hover:text-ink"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[12px] font-bold",
                  active ? "bg-primary-pale text-primary" : "bg-line-soft text-ink-subtle"
                )}
              >
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
