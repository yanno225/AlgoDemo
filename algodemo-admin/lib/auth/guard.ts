import { redirect } from "next/navigation";
import { getSession } from "./session";
import { canAccessPath } from "@/lib/navigation";
import type { AdminUser } from "@/lib/domain/types";

/**
 * Contrôle d'accès à une section du back-office.
 *
 * À appeler depuis le `layout.tsx` de chaque section. Masquer une entrée de
 * menu ne protège rien : sans cette vérification, l'URL reste atteignable au
 * clavier par un compte non habilité.
 *
 * Les droits sont lus depuis `NAV_ITEMS`, seule source de vérité — modifier
 * une permission à cet endroit l'applique partout d'un coup.
 *
 * @param sectionHref chemin de la section, tel que déclaré dans `NAV_ITEMS`
 */
export async function requireSectionAccess(
  sectionHref: string
): Promise<AdminUser> {
  const user = await getSession();

  // La mise en page parente a déjà traité l'absence de session ; ce garde-fou
  // couvre le cas où cette section serait déplacée hors du back-office.
  if (!user) redirect("/connexion");

  if (!canAccessPath(user.role, sectionHref)) {
    // Renvoi vers le tableau de bord plutôt qu'une page d'erreur : le compte
    // est légitime, seule cette section lui est fermée.
    redirect("/");
  }

  return user;
}
