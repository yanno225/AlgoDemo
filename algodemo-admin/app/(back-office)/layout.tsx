import { redirect } from "next/navigation";
import { getSession, readSession } from "@/lib/auth/session";
import { getNavForRole } from "@/lib/navigation";
import { hasRole, BACK_OFFICE_ROLES } from "@/lib/domain/roles";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

/**
 * Mise en page du back-office.
 *
 * La garde d'accès vit ici, côté serveur : masquer des entrées de menu ne
 * protège rien, seule une vérification avant rendu empêche d'atteindre une
 * page par son URL.
 */
export default async function BackOfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, session] = await Promise.all([getSession(), readSession()]);

  if (!user) {
    // Une session entamée mais incomplète est renvoyée vers l'étape qui
    // manque, plutôt que vers le début : refaire une 2FA déjà validée
    // n'apporte aucune sécurité et agace l'utilisateur.
    if (session?.stage === "credentials") redirect("/connexion/verification");
    if (session?.stage === "verified") redirect("/connexion/protocole");
    redirect("/connexion");
  }

  if (!hasRole(user.role, BACK_OFFICE_ROLES)) {
    redirect("/connexion?erreur=acces-refuse");
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar items={getNavForRole(user.role)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        {/* Le rembourrage horizontal doit rester identique à celui de la
            barre du haut, sinon la recherche et le titre de page ne
            s'alignent plus verticalement. */}
        <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
