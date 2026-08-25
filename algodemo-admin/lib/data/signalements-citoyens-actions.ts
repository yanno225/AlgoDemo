"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api/client";
import { requireSectionAccess } from "@/lib/auth/guard";

/**
 * Cycle de vie d'un signalement citoyen : reçu → en cours → résolu/rejeté.
 * Chaque action revérifie les droits — une Server Action est joignable par
 * POST direct, pas seulement depuis l'interface.
 */
export async function changerStatutSignalement(formData: FormData) {
  await requireSectionAccess("/signalements");
  const id = String(formData.get("id") ?? "");
  const statut = String(formData.get("statut") ?? "");
  if (!id || !["RECU", "EN_COURS", "RESOLU", "REJETE"].includes(statut)) return;

  await apiFetch(`/participation/signalements/${id}/statut`, {
    methode: "PATCH",
    corps: { statut },
  });
  revalidatePath("/signalements");
}
