import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { BrandPanel } from "@/components/access/BrandPanel";

/**
 * Mise en page du parcours d'accès (connexion, 2FA, protocole).
 *
 * Écran scindé : l'identité à gauche, la saisie à droite. En dessous de
 * 1024 px, le panneau vert se replie en bandeau d'en-tête et le formulaire
 * passe dessous — la colonne verte deviendrait sinon un mur à franchir avant
 * le moindre champ.
 *
 * Aucune navigation vers le back-office n'est proposée : tant que l'identité
 * n'est pas établie, il n'y a rien à atteindre.
 */
export default async function AccesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Une session déjà complète n'a rien à faire ici.
  const session = await readSession();
  if (session?.stage === "active") redirect("/");

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <BrandPanel />

      <main className="flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-[26rem]">{children}</div>
      </main>
    </div>
  );
}
