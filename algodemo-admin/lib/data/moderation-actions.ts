"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch, apiUpload } from "@/lib/api/client";
import { requireSectionAccess } from "@/lib/auth/guard";
import { THEMATICS } from "@/lib/domain/thematics";

/**
 * Actions de modération (POINT_FOCAL et ADMIN côté API, selon la file).
 *
 * Chaque action revérifie les droits : une Server Action est joignable par
 * POST direct, pas seulement depuis l'interface.
 */

function invalider() {
  revalidatePath("/moderation");
}

// ─── Publication de contenus ─────────────────────────────────────────

const normaliser = (texte: string) =>
  texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

/** Slug de la charte → UUID backend, par libellé normalisé (comme partout). */
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

/**
 * Crée un contenu du feed (vidéo, fiche, article). Il naît NON PUBLIÉ et
 * non vérifié : il rejoint la file de vérification, et « Publier » ne
 * s'ouvre qu'une fois le statut VERIFIE (RG-FEED-01).
 */
export async function creerContenu(formData: FormData) {
  await requireSectionAccess("/moderation");

  const type = String(formData.get("type") ?? "");
  const titre = String(formData.get("titre") ?? "").trim();
  const corps = String(formData.get("corps") ?? "").trim();
  const slug = String(formData.get("thematique") ?? "");
  const source = String(formData.get("source") ?? "").trim();
  const estOfficiel = formData.get("officiel") === "on";
  if (!titre || !corps || !slug) return;
  if (!["VIDEO", "FICHE", "ARTICLE"].includes(type)) return;

  const thematiqueId = await resoudreThematique(slug);
  if (!thematiqueId) return;

  // Le média (vidéo MP4/WebM ou image) part d'abord vers MinIO.
  let urlMedia: string | undefined;
  const media = formData.get("media");
  if (media instanceof File && media.size > 0) {
    const televerse = await apiUpload<{ url: string }>("/media/upload", media);
    urlMedia = televerse.url;
  }

  await apiFetch("/feed", {
    methode: "POST",
    corps: {
      type,
      titre,
      corps,
      thematiqueId,
      ...(source ? { source } : {}),
      ...(urlMedia ? { urlMedia } : {}),
      estOfficiel,
    },
  });

  invalider();
  redirect("/moderation?onglet=verifications");
}

/**
 * Suppression DÉFINITIVE d'un contenu (ADMIN côté API) : le contenu, ses
 * commentaires et ses réactions disparaissent en cascade. Pour un simple
 * retrait du feed, « Dépublier » suffit et reste réversible.
 */
export async function supprimerContenu(formData: FormData) {
  await requireSectionAccess("/moderation");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await apiFetch(`/feed/${id}`, { methode: "DELETE" });
  invalider();
}

// ─── Avis citoyens ───────────────────────────────────────────────────

export async function modererAvis(formData: FormData) {
  await requireSectionAccess("/moderation");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const motif = String(formData.get("motif") ?? "").trim();
  if (!id || (decision !== "APPROUVE" && decision !== "REJETE")) return;

  await apiFetch(`/avis/${id}/moderer`, {
    methode: "PATCH",
    corps: { decision, ...(motif ? { motif } : {}) },
  });
  invalider();
}

// ─── Signalements ────────────────────────────────────────────────────

export async function traiterSignalement(formData: FormData) {
  await requireSectionAccess("/moderation");
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!id || (action !== "DEPUBLIER" && action !== "IGNORER")) return;

  await apiFetch(`/feed/signalements/${id}/traiter`, {
    methode: "PATCH",
    corps: { action },
  });
  invalider();
}

// ─── Vérification et publication des contenus ────────────────────────

const STATUTS_VERIFICATION = [
  "NON_VERIFIE",
  "PARTIELLEMENT_VERIFIE",
  "VERIFIE",
] as const;

export async function changerVerification(formData: FormData) {
  await requireSectionAccess("/moderation");
  const id = String(formData.get("id") ?? "");
  const statut = String(formData.get("statut") ?? "");
  if (
    !id ||
    !STATUTS_VERIFICATION.includes(statut as (typeof STATUTS_VERIFICATION)[number])
  ) {
    return;
  }

  await apiFetch(`/feed/${id}`, {
    methode: "PATCH",
    corps: { statutVerification: statut },
  });
  invalider();
}

export async function publierContenu(formData: FormData) {
  await requireSectionAccess("/moderation");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await apiFetch(`/feed/${id}/publier`, { methode: "PATCH" });
  invalider();
}

export async function depublierContenu(formData: FormData) {
  await requireSectionAccess("/moderation");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await apiFetch(`/feed/${id}/depublier`, { methode: "PATCH" });
  invalider();
}

// ─── Textes générés par l'IA (synthèses fiche pays, résumés de débats) ──
// La correction éventuelle de l'admin part avec la validation : c'est le
// texte corrigé qui est publié, jamais le brouillon IA tel quel.

export async function validerSynthese(formData: FormData) {
  await requireSectionAccess("/moderation");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const texteCorrige = String(formData.get("texteCorrige") ?? "").trim();
  await apiFetch(`/syntheses/${id}/valider`, {
    methode: "PATCH",
    corps: texteCorrige ? { texteCorrige } : {},
  });
  invalider();
}

export async function rejeterSynthese(formData: FormData) {
  await requireSectionAccess("/moderation");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await apiFetch(`/syntheses/${id}/rejeter`, { methode: "PATCH" });
  invalider();
}

export async function validerResume(formData: FormData) {
  await requireSectionAccess("/moderation");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const texteCorrige = String(formData.get("texteCorrige") ?? "").trim();
  await apiFetch(`/debats/resumes/${id}/valider`, {
    methode: "PATCH",
    corps: texteCorrige ? { texteCorrige } : {},
  });
  invalider();
}

export async function rejeterResume(formData: FormData) {
  await requireSectionAccess("/moderation");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await apiFetch(`/debats/resumes/${id}/rejeter`, { methode: "PATCH" });
  invalider();
}
