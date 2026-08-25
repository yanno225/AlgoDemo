"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api/client";
import { requireSectionAccess } from "@/lib/auth/guard";
import { ROLES, type UserRole } from "@/lib/domain/roles";
import { VERS_BACKEND } from "./comptes";

/**
 * Mutations sur les comptes (§9.3).
 *
 * Une Server Action est joignable par POST direct, pas seulement depuis
 * l'interface : chacune revérifie donc les droits. `requireSectionAccess`
 * renvoie l'administrateur courant, ce qui permet en plus de l'empêcher
 * d'agir sur son propre compte.
 */

/** Valider ou invalider un compte. */
export async function validerCompte(formData: FormData) {
  await requireSectionAccess("/comptes");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await apiFetch(`/auth/users/${id}/valider`, {
    methode: "PATCH",
    corps: { valide: formData.get("valide") === "true" },
  });
  revalidatePath("/comptes");
  revalidatePath(`/comptes/${id}`);
}

/** Bloquer ou débloquer un compte. */
export async function bloquerCompte(formData: FormData) {
  const moi = await requireSectionAccess("/comptes");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Se bloquer soi-même fermerait l'accès au back-office sans recours.
  if (id === moi.id) {
    throw new Error("Vous ne pouvez pas bloquer votre propre compte.");
  }

  await apiFetch(`/auth/users/${id}/bloquer`, {
    methode: "PATCH",
    corps: { bloque: formData.get("bloque") === "true" },
  });
  revalidatePath("/comptes");
  revalidatePath(`/comptes/${id}`);
}

/** Changer le rôle d'un compte (certification d'un point focal, §9.3). */
export async function changerRole(formData: FormData) {
  const moi = await requireSectionAccess("/comptes");
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;

  if (!id || !Object.values(ROLES).includes(role)) return;

  // Se retirer soi-même le rôle administrateur couperait l'accès en cours.
  if (id === moi.id && role !== ROLES.ADMIN_LABO) {
    throw new Error("Vous ne pouvez pas retirer votre propre rôle d'administrateur.");
  }

  await apiFetch(`/auth/users/${id}/role`, {
    methode: "PATCH",
    corps: { role: VERS_BACKEND[role] },
  });
  revalidatePath("/comptes");
  revalidatePath(`/comptes/${id}`);
}
