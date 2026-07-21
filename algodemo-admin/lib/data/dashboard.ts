import type { ActivityEvent } from "@/lib/domain/types";

/**
 * Indicateurs de pilotage et journal d'activité.
 *
 * TODO(backend) : GET /admin/dashboard — les compteurs doivent être calculés
 * côté serveur, jamais dérivés d'une liste paginée côté client.
 */

export interface DashboardAlert {
  key: "moderation" | "verification" | "certification";
  label: string;
  count: number;
  detail: string;
  href: string;
}

export async function getDashboardAlerts(): Promise<DashboardAlert[]> {
  return [
    {
      key: "moderation",
      label: "Modération",
      count: 12,
      detail: "avis en attente de modération",
      href: "/moderation",
    },
    {
      key: "verification",
      label: "Vérification",
      count: 5,
      detail: "contenus en attente de vérification",
      href: "/moderation?onglet=verification",
    },
    {
      key: "certification",
      label: "Certifications",
      count: 3,
      detail: "demandes de certification",
      href: "/comptes",
    },
  ];
}

export async function getRecentActivity(): Promise<ActivityEvent[]> {
  return [
    {
      id: "act_1",
      label: "Certification accordée",
      detail: "à Jean D.",
      at: "2026-07-21T10:45:00.000Z",
    },
    {
      id: "act_2",
      label: "Débat clôturé",
      detail: "Mobilité douce — Abidjan Plateau",
      at: "2026-07-21T09:12:00.000Z",
    },
    {
      id: "act_3",
      label: "Nouveau compte admin",
      detail: "créé par Marie L.",
      at: "2026-07-20T16:30:00.000Z",
    },
  ];
}
