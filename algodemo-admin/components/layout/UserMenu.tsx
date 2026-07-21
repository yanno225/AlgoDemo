"use client";

import Link from "next/link";
import { ChevronDown, UserCog, Settings, LifeBuoy, LogOut } from "lucide-react";
import type { AdminUser } from "@/lib/domain/types";
import { ROLE_LABELS } from "@/lib/domain/roles";
import { Dropdown } from "@/components/ui/Dropdown";
import { cn } from "@/lib/cn";

interface UserMenuProps {
  user: AdminUser;
  initials: string;
  /** Action serveur de déconnexion — elle seule peut détruire le cookie. */
  signOutAction: () => Promise<void>;
}

const LINKS = [
  { href: "/comptes", label: "Rôle et permissions", icon: UserCog },
  { href: "/referentiel", label: "Préférences", icon: Settings },
  { href: "/connexion", label: "Assistance", icon: LifeBuoy },
];

/** Menu de session : identité, raccourcis, déconnexion. */
export function UserMenu({ user, initials, signOutAction }: UserMenuProps) {
  return (
    <Dropdown
      label="Menu du compte"
      panelClassName="w-64"
      trigger={(isOpen) => (
        <span
          className={cn(
            "flex items-center gap-2.5 rounded-lg bg-surface py-1.5 pl-1.5 pr-3 shadow-sm ring-1 transition-shadow",
            isOpen ? "ring-primary/30 shadow-md" : "ring-hairline hover:shadow-md"
          )}
        >
          <span className="grid size-8 place-items-center rounded-md bg-primary text-[13px] font-bold text-ink-inverse">
            {initials}
          </span>
          <span className="hidden min-w-0 text-left leading-tight sm:block">
            <span className="block truncate text-[14px] font-semibold text-ink">
              {user.firstName} {user.lastName}
            </span>
            <span className="block truncate text-[12px] text-ink-subtle">
              {ROLE_LABELS[user.role]}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-ink-subtle transition-transform duration-200",
              isOpen && "rotate-180"
            )}
            aria-hidden
          />
        </span>
      )}
    >
      <div className="border-b border-line-soft px-4 py-3">
        <p className="truncate text-[14px] font-bold text-ink">
          {user.firstName} {user.lastName}
        </p>
        <p className="truncate font-mono text-[12px] text-ink-subtle">{user.email}</p>
      </div>

      <ul className="py-1">
        {LINKS.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
            >
              <link.icon className="size-4 shrink-0 text-ink-subtle" aria-hidden />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <form action={signOutAction} className="border-t border-line-soft p-1">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-semibold text-danger transition-colors hover:bg-danger-pale"
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          Déconnexion
        </button>
      </form>
    </Dropdown>
  );
}
