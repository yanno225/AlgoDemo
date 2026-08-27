"use client";

import { useTransition } from "react";
import { CalendarX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { annulerDebat, supprimerDebat } from "@/lib/data/debats-actions";

/**
 * Annuler / supprimer un débat qui n'a pas encore eu lieu.
 *
 * L'annulation retire le débat des écrans citoyens en le gardant tracé en
 * base ; la suppression est définitive et emporte participations, votes et
 * messages — d'où la confirmation explicite avant d'agir.
 */
export function ActionsDebatPlanifie({
  debatId,
  titre,
  annulable = true,
}: {
  debatId: string;
  titre: string;
  /** Faux pour un débat déjà annulé : seul « Supprimer » reste utile. */
  annulable?: boolean;
}) {
  const [enCours, demarrer] = useTransition();

  const executer = (action: (formData: FormData) => Promise<void>) =>
    demarrer(async () => {
      const donnees = new FormData();
      donnees.set("id", debatId);
      await action(donnees);
    });

  return (
    <div className="mt-2 flex gap-2">
      {annulable && (
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          disabled={enCours}
          icon={<CalendarX className="size-3.5" />}
          onClick={() => {
            if (
              window.confirm(
                `Annuler « ${titre} » ? Le débat disparaîtra de l'application citoyenne mais restera tracé ici.`,
              )
            ) {
              executer(annulerDebat);
            }
          }}
        >
          Annuler
        </Button>
      )}
      <Button
        size="sm"
        variant="danger"
        className="flex-1"
        disabled={enCours}
        icon={<Trash2 className="size-3.5" />}
        onClick={() => {
          if (
            window.confirm(
              `Supprimer définitivement « ${titre} » ? Participations, votes et messages seront effacés — cette action est irréversible.`,
            )
          ) {
            executer(supprimerDebat);
          }
        }}
      >
        Supprimer
      </Button>
    </div>
  );
}
