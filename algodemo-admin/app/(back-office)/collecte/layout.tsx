import { requireSectionAccess } from "@/lib/auth/guard";

export default async function SectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSectionAccess("/collecte");
  return <>{children}</>;
}
