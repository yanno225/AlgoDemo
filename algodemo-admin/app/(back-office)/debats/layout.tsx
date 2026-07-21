import { requireSectionAccess } from "@/lib/auth/guard";

/**
 * Contrôle d'accès de la section « debats ».
 *
 * Les droits proviennent de `NAV_ITEMS` : cette barrière suit
 * automatiquement toute évolution des permissions.
 */
export default async function SectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSectionAccess("/debats");
  return <>{children}</>;
}
