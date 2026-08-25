"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api/client";
import { requireSectionAccess } from "@/lib/auth/guard";
import type { BilanCollecte } from "@/lib/domain/types";

/**
 * Mutations de la collecte.
 *
 * Une Server Action est joignable par POST direct, pas seulement depuis
 * l'interface : chacune revérifie donc les droits, sans se reposer sur la
 * garde du layout.
 */

/** Valider une proposition → la valeur entre dans la Fiche-pays. */
export async function validerProposition(formData: FormData) {
  await requireSectionAccess("/collecte");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await apiFetch(`/collecte/propositions/${id}/valider`, { methode: "PATCH" });
  revalidatePath("/collecte");
}

/** Rejeter une proposition (conservée en base pour la traçabilité). */
export async function rejeterProposition(formData: FormData) {
  await requireSectionAccess("/collecte");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await apiFetch(`/collecte/propositions/${id}/rejeter`, { methode: "PATCH" });
  revalidatePath("/collecte");
}

/** Déclencher immédiatement la collecte de toutes les sources branchées. */
export async function lancerCollecte(): Promise<void> {
  await requireSectionAccess("/collecte");
  await apiFetch<BilanCollecte>("/collecte/lancer", { methode: "POST" });
  revalidatePath("/collecte");
}

/** Ajouter une source à la liste blanche. */
export async function ajouterSource(formData: FormData) {
  await requireSectionAccess("/collecte");
  const libelle = String(formData.get("libelle") ?? "").trim();
  if (!libelle) return;

  const domaine = String(formData.get("domaine") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  await apiFetch("/collecte/sources", {
    methode: "POST",
    // Le backend refuse toute propriété inconnue (forbidNonWhitelisted) :
    // on n'envoie que les champs réellement renseignés.
    corps: {
      libelle,
      ...(domaine ? { domaine } : {}),
      ...(description ? { description } : {}),
    },
  });
  revalidatePath("/collecte/sources");
}

/** Activer / désactiver une source (jamais de suppression : traçabilité). */
export async function basculerSource(formData: FormData) {
  await requireSectionAccess("/collecte");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await apiFetch(`/collecte/sources/${id}`, {
    methode: "PATCH",
    corps: { active: formData.get("active") === "true" },
  });
  revalidatePath("/collecte/sources");
}
