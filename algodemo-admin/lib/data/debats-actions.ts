"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch, apiUpload } from "@/lib/api/client";
import { requireSectionAccess } from "@/lib/auth/guard";
import { THEMATICS } from "@/lib/domain/thematics";

/**
 * Actions débats & consultations (POINT_FOCAL et ADMIN côté API).
 *
 * Chaque action revérifie les droits : une Server Action est joignable par
 * POST direct, pas seulement depuis l'interface.
 */

function invalider() {
  revalidatePath("/debats");
}

const normaliser = (texte: string) =>
  texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

/**
 * Le sélecteur de thématiques manipule les slugs de la charte
 * (`genre_societe`…) ; l'API identifie par UUID. La correspondance se fait
 * par libellé normalisé, comme partout ailleurs dans le projet.
 */
async function resoudreThematique(slug: string): Promise<string | null> {
  const config = THEMATICS.find((thematic) => thematic.id === slug);
  if (!config) return null;
  const thematiques = await apiFetch<{ id: string; libelle: string }[]>(
    "/thematiques",
  );
  return (
    thematiques.find(
      (thematique) => normaliser(thematique.libelle) === normaliser(config.label),
    )?.id ?? null
  );
}

// ─── Débats ──────────────────────────────────────────────────────────

export async function creerDebat(formData: FormData) {
  const moi = await requireSectionAccess("/debats");

  const titre = String(formData.get("titre") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const slug = String(formData.get("thematique") ?? "");
  const date = String(formData.get("date") ?? "");
  const heure = String(formData.get("heure") ?? "");
  if (!titre || !slug || !date || !heure) return;

  const thematiqueId = await resoudreThematique(slug);
  if (!thematiqueId) return;

  // Couverture facultative : uploadée vers MinIO avant la création — c'est
  // elle qui distinguera ce live des autres directs simultanés côté mobile.
  let urlCouverture: string | undefined;
  const couverture = formData.get("couverture");
  if (couverture instanceof File && couverture.size > 0) {
    const media = await apiUpload<{ url: string }>("/media/upload", couverture);
    urlCouverture = media.url;
  }

  await apiFetch("/debats", {
    methode: "POST",
    corps: {
      titre,
      ...(description ? { description } : {}),
      ...(urlCouverture ? { urlCouverture } : {}),
      thematiqueId,
      dateDebut: new Date(`${date}T${heure}:00`).toISOString(),
      // L'admin qui planifie anime par défaut — modifiable ensuite.
      moderateurId: moi.id,
    },
  });

  invalider();
  redirect("/debats");
}

export async function demarrerDebat(formData: FormData) {
  await requireSectionAccess("/debats");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await apiFetch(`/debats/${id}/demarrer`, { methode: "PATCH" });
  invalider();
  // La console du direct affiche l'état du débat : elle doit suivre.
  revalidatePath(`/debats/${id}/direct`);
}

export async function cloturerDebat(formData: FormData) {
  await requireSectionAccess("/debats");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await apiFetch(`/debats/${id}/cloturer`, { methode: "PATCH" });
  invalider();
  revalidatePath(`/debats/${id}/direct`);
}

// ─── Console du direct ───────────────────────────────────────────────

/**
 * Soumet une affirmation au vote de la salle. La gateway la diffuse en
 * temps réel (`affirmation.nouvelle`) : la console comme les mobiles la
 * voient arriver sans rechargement.
 */
export async function creerAffirmation(formData: FormData) {
  await requireSectionAccess("/debats");
  const debatId = String(formData.get("debatId") ?? "");
  const texte = String(formData.get("texte") ?? "").trim();
  if (!debatId || !texte) return;
  await apiFetch(`/debats/${debatId}/affirmations`, {
    methode: "POST",
    corps: { texte },
  });
  invalider();
}

/** Ferme le vote d'une affirmation — le décompte final est diffusé à la salle. */
export async function fermerAffirmation(formData: FormData) {
  await requireSectionAccess("/debats");
  const affirmationId = String(formData.get("affirmationId") ?? "");
  if (!affirmationId) return;
  await apiFetch(`/debats/affirmations/${affirmationId}/fermer`, {
    methode: "PATCH",
  });
  invalider();
}

/** Marque un signalement du live comme traité. */
export async function traiterSignalement(formData: FormData) {
  await requireSectionAccess("/debats");
  const signalementId = String(formData.get("signalementId") ?? "");
  if (!signalementId) return;
  await apiFetch(`/debats/signalements/${signalementId}/traiter`, {
    methode: "PATCH",
  });
  invalider();
}

// ─── Consultations ───────────────────────────────────────────────────

export async function creerConsultation(formData: FormData) {
  await requireSectionAccess("/debats");

  // Sondage = même moteur à bulletin secret, onglet dédié côté mobile.
  const type = formData.get("type") === "SONDAGE" ? "SONDAGE" : "CONSULTATION";
  const titre = String(formData.get("titre") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const resumeVulgarise = String(formData.get("resume") ?? "").trim();
  const dateOuverture = String(formData.get("ouverture") ?? "");
  const dateCloture = String(formData.get("cloture") ?? "");

  // Les options de vote arrivent en champs `option-1`, `option-2`, … —
  // l'API exige au moins deux libellés non vides (RG-CON-05).
  const options = Array.from(formData.entries())
    .filter(([cle]) => cle.startsWith("option-"))
    .map(([, valeur]) => String(valeur).trim())
    .filter(Boolean);

  if (!titre || !description || !resumeVulgarise) return;
  if (!dateOuverture || !dateCloture || options.length < 2) return;

  await apiFetch("/consultations", {
    methode: "POST",
    corps: {
      type,
      titre,
      description,
      resumeVulgarise,
      dateOuverture: new Date(`${dateOuverture}T00:00:00`).toISOString(),
      dateCloture: new Date(`${dateCloture}T23:59:59`).toISOString(),
      options,
    },
  });

  invalider();
  redirect("/debats?onglet=consultations");
}

/** Les résultats restent invisibles des citoyens tant qu'un admin ne publie pas. */
export async function publierResultats(formData: FormData) {
  await requireSectionAccess("/debats");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await apiFetch(`/consultations/${id}/resultats/publier`, { methode: "PATCH" });
  invalider();
}
