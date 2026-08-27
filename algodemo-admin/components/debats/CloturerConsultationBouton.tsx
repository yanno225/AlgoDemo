"use client";

import { useTransition } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cloturerConsultation } from "@/lib/data/debats-actions";

/**
 * Clôture anticipée d'une consultation ouverte : le vote ferme
 * IMMÉDIATEMENT pour tous les citoyens — d'où la confirmation explicite.
 * La carte passe ensuite dans « Clôturées », prête pour la publication.
 */
export function CloturerConsultationBouton({
  consultationId,
  titre,
}: {
  consultationId: string;
  titre: string;
}) {
  const [enCours, demarrer] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      className="mt-4 w-full"
      disabled={enCours}
      icon={<Lock className="size-3.5" />}
      onClick={() => {
        if (
          window.confirm(
            `Clôturer « ${titre} » maintenant ? Le vote fermera immédiatement pour tous les citoyens — vous pourrez ensuite publier les résultats.`,
          )
        ) {
          demarrer(async () => {
            const donnees = new FormData();
            donnees.set("id", consultationId);
            await cloturerConsultation(donnees);
          });
        }
      }}
    >
      {enCours ? "Clôture…" : "Clôturer le vote"}
    </Button>
  );
}
