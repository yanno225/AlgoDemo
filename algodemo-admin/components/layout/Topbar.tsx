import { Search } from "lucide-react";
import type { AdminUser } from "@/lib/domain/types";
import { getInitials } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { getNavForRole } from "@/lib/navigation";
import { listNotifications } from "@/lib/data/notifications";
import { NotificationsMenu } from "./NotificationsMenu";
import { UserMenu } from "./UserMenu";
import { MobileNav } from "./MobileNav";

interface TopbarProps {
  user: AdminUser;
}

/**
 * En-tête du back-office : recherche, notifications, session.
 *
 * Rendu côté serveur ; seuls les deux menus déroulants sont interactifs. Les
 * initiales sont calculées ici pour que le composant client n'ait pas à
 * importer la couche de session.
 */
export async function Topbar({ user }: TopbarProps) {
  const notifications = await listNotifications();

  return (
    <header className="sticky top-0 z-20 flex h-18 shrink-0 items-center gap-4 border-b border-hairline bg-canvas/80 px-6 backdrop-blur-md lg:px-10">
      {/* Sous 1024px, la colonne latérale n'existe plus : le tiroir prend
          le relais avec les mêmes entrées, filtrées par le même rôle. */}
      <MobileNav items={getNavForRole(user.role)} />

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Rechercher un contenu, une consultation…"
          aria-label="Rechercher dans le back-office"
          className="h-10 w-full rounded-lg bg-surface pl-10 pr-4 text-[14px] text-ink shadow-sm ring-1 ring-hairline transition-shadow placeholder:text-ink-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-medium"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <NotificationsMenu notifications={notifications} />
        <UserMenu user={user} initials={getInitials(user)} signOutAction={signOut} />
      </div>
    </header>
  );
}
