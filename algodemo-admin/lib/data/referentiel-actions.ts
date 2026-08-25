"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { requireSectionAccess } from "@/lib/auth/guard";

/**
 * Mutations du référentiel (réservées ADMIN côté API).
 *
 * Les thématiques sont fixes (RG-THE-01) : aucune action ne les crée ni ne
 * les supprime — seuls les critères et indicateurs sont administrables.
 *
 * Chaque action revérifie les droits : une Server Action est joignable par
 * POST direct, pas seulement depuis l'interface.
 */

/** Toute la section partage le même cache : une invalidation suffit. */
function invalider() {
  revalidatePath("/referentiel", "layout");
}

// ─── Critères ────────────────────────────────────────────────────────

export async function creerCritere(formData: FormData) {
  await requireSectionAccess("/referentiel");
  const libelle = String(formData.get("libelle") ?? "").trim();
  const thematiqueId = String(formData.get("thematiqueId") ?? "");
  if (!libelle || !thematiqueId) return;

  await apiFetch("/criteres", {
    methode: "POST",
    corps: { libelle, thematiqueId },
  });
  invalider();
}

export async function renommerCritere(formData: FormData) {
  await requireSectionAccess("/referentiel");
  const id = String(formData.get("id") ?? "");
  const libelle = String(formData.get("libelle") ?? "").trim();
  if (!id || !libelle) return;

  await apiFetch(`/criteres/${id}`, {
    methode: "PATCH",
    corps: { libelle },
  });
  invalider();
}

/**
 * Suppression en cascade : les indicateurs du critère et toutes leurs valeurs
 * publiées disparaissent avec lui. L'interface l'annonce avant confirmation.
 */
export async function supprimerCritere(formData: FormData) {
  await requireSectionAccess("/referentiel");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await apiFetch(`/criteres/${id}`, { methode: "DELETE" });
  invalider();
}

// ─── Indicateurs ─────────────────────────────────────────────────────

export async function creerIndicateur(formData: FormData) {
  await requireSectionAccess("/referentiel");
  const libelle = String(formData.get("libelle") ?? "").trim();
  const critereId = String(formData.get("critereId") ?? "");
  if (!libelle || !critereId) return;

  await apiFetch("/indicateurs", {
    methode: "POST",
    corps: { libelle, critereId },
  });
  invalider();
}

export async function renommerIndicateur(formData: FormData) {
  await requireSectionAccess("/referentiel");
  const id = String(formData.get("id") ?? "");
  const libelle = String(formData.get("libelle") ?? "").trim();
  if (!id || !libelle) return;

  await apiFetch(`/indicateurs/${id}`, {
    methode: "PATCH",
    corps: { libelle },
  });
  invalider();
}

/**
 * Supprime l'indicateur et ses valeurs publiées (cascade). Si `retour` est
 * fourni (suppression depuis la fiche de l'indicateur), on y redirige : la
 * page de l'indicateur n'existe plus.
 */
export async function supprimerIndicateur(formData: FormData) {
  await requireSectionAccess("/referentiel");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await apiFetch(`/indicateurs/${id}`, { methode: "DELETE" });
  invalider();

  const retour = String(formData.get("retour") ?? "");
  if (retour.startsWith("/referentiel")) redirect(retour);
}
