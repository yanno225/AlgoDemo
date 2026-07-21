export type NotificationKind =
  | "moderation"
  | "verification"
  | "certification"
  | "debate";

export interface AdminNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  at: string;
  isRead: boolean;
  href: string;
}

/**
 * Notifications de l'administration.
 *
 * TODO(backend) : GET /admin/notifications, puis PATCH .../read. Le flux
 * temps réel passera par un canal dédié — le panneau se contentera d'ajouter
 * les entrées reçues en tête de liste.
 */
export async function listNotifications(): Promise<AdminNotification[]> {
  return [
    {
      id: "notif_1",
      kind: "verification",
      title: "Alerte bloquante",
      detail: "Déclaration patrimoine élu local — discordance de source détectée.",
      at: "2026-07-21T09:40:00.000Z",
      isRead: false,
      href: "/moderation/verifications/ver_3",
    },
    {
      id: "notif_2",
      kind: "moderation",
      title: "3 nouveaux avis",
      detail: "Consultation Rail 2030 — en attente de modération.",
      at: "2026-07-21T08:15:00.000Z",
      isRead: false,
      href: "/moderation?onglet=avis",
    },
    {
      id: "notif_3",
      kind: "certification",
      title: "Demande de certification",
      detail: "Amira K. sollicite le statut de point focal.",
      at: "2026-07-20T17:05:00.000Z",
      isRead: false,
      href: "/comptes",
    },
    {
      id: "notif_4",
      kind: "debate",
      title: "Synthèse IA générée",
      detail: "Débat Rail — la synthèse attend votre validation.",
      at: "2026-07-20T12:00:00.000Z",
      isRead: true,
      href: "/debats",
    },
  ];
}
