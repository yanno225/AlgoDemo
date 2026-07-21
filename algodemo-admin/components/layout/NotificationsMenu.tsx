"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ShieldCheck, FileSearch, BadgeCheck, Sparkles, Check } from "lucide-react";
import type { AdminNotification, NotificationKind } from "@/lib/data/notifications";
import { formatRelative } from "@/lib/format";
import { Dropdown } from "@/components/ui/Dropdown";
import { cn } from "@/lib/cn";

const KIND_META: Record<
  NotificationKind,
  { icon: typeof Bell; className: string }
> = {
  moderation: { icon: ShieldCheck, className: "bg-secondary/15 text-secondary" },
  verification: { icon: FileSearch, className: "bg-danger/12 text-danger" },
  certification: { icon: BadgeCheck, className: "bg-primary-pale text-primary" },
  debate: { icon: Sparkles, className: "bg-info/12 text-info" },
};

interface NotificationsMenuProps {
  notifications: AdminNotification[];
}

/**
 * Panneau de notifications.
 *
 * L'état de lecture est tenu localement en attendant l'API : le compteur et
 * la mise en avant réagissent immédiatement, et il suffira de remplacer les
 * deux `setItems` par un appel `PATCH` pour rendre la chose persistante.
 */
export function NotificationsMenu({ notifications }: NotificationsMenuProps) {
  const [items, setItems] = useState(notifications);
  const unread = items.filter((item) => !item.isRead).length;

  const markAllRead = () =>
    // TODO(backend) : PATCH /admin/notifications/read-all
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));

  const markRead = (id: string) =>
    // TODO(backend) : PATCH /admin/notifications/:id/read
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );

  return (
    <Dropdown
      label={
        unread > 0
          ? `Notifications, ${unread} non lue${unread > 1 ? "s" : ""}`
          : "Notifications"
      }
      panelClassName="w-[min(22rem,calc(100vw-2rem))]"
      trigger={(isOpen) => (
        <span
          className={cn(
            "relative grid size-10 place-items-center rounded-lg transition-colors",
            isOpen ? "bg-surface text-ink" : "text-ink-muted hover:bg-surface hover:text-ink"
          )}
        >
          <Bell className="size-[18px]" aria-hidden />
          {unread > 0 && (
            <span
              className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-danger text-[10px] font-bold text-white ring-2 ring-canvas"
              aria-hidden
            >
              {unread}
            </span>
          )}
        </span>
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
        <p className="text-[14px] font-bold text-ink">Notifications</p>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary transition-colors hover:underline"
          >
            <Check className="size-3" aria-hidden />
            Tout marquer comme lu
          </button>
        )}
      </div>

      <ul className="max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <li className="px-4 py-10 text-center text-[14px] text-ink-muted">
            Aucune notification.
          </li>
        ) : (
          items.map((item) => {
            const meta = KIND_META[item.kind];
            const Icon = meta.icon;

            return (
              <li key={item.id} className="border-b border-line-soft last:border-0">
                <Link
                  href={item.href}
                  onClick={() => markRead(item.id)}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors hover:bg-surface-raised",
                    !item.isRead && "bg-primary-pale/40"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-md",
                      meta.className
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-semibold text-ink">
                        {item.title}
                      </span>
                      {!item.isRead && (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-danger"
                          aria-label="Non lue"
                        />
                      )}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-ink-muted">
                      {item.detail}
                    </span>
                    <span className="mt-1 block text-[12px] text-ink-subtle">
                      {formatRelative(item.at)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </Dropdown>
  );
}
