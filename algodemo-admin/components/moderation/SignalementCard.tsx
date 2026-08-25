import { EyeOff, Flag, ShieldCheck } from "lucide-react";
import type { SignalementEnAttente } from "@/lib/data/moderation";
import { traiterSignalement } from "@/lib/data/moderation-actions";
import { formatRelative } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { PanneauAction } from "@/components/referentiel/PanneauAction";

interface SignalementCardProps {
  signalement: SignalementEnAttente;
  index?: number;
}

/**
 * Signalement d'un contenu du feed par un citoyen.
 *
 * Deux issues : dépublier le contenu visé (retiré immédiatement de
 * l'application) ou clore le signalement sans action. La dépublication
 * touche tous les lecteurs — elle se confirme en deux temps.
 */
export function SignalementCard({ signalement, index = 0 }: SignalementCardProps) {
  return (
    <article
      className="animate-rise rounded-xl bg-surface p-5 shadow-sm ring-1 ring-hairline"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <header className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-danger-pale">
          <Flag className="size-4 text-danger" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-subtle">
            Contenu visé
          </p>
          <p className="text-[15px] font-bold leading-snug text-ink">
            {signalement.contenu.titre}
          </p>
        </div>
      </header>

      <blockquote className="mt-4 rounded-lg bg-surface-raised p-3 text-[14px] leading-relaxed text-ink">
        « {signalement.motif} »
      </blockquote>

      <p className="mt-2 text-[12px] text-ink-subtle">
        Signalé par {signalement.signaleur ?? "un citoyen"} ·{" "}
        {formatRelative(signalement.creeLe)}
      </p>

      <footer className="mt-4 flex flex-wrap items-start gap-2 border-t border-line-soft pt-4">
        <form action={traiterSignalement} className="flex-1">
          <input type="hidden" name="id" value={signalement.id} />
          <input type="hidden" name="action" value="IGNORER" />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="w-full"
            icon={<ShieldCheck className="size-3.5" />}
          >
            Sans suite
          </Button>
        </form>

        <PanneauAction
          libelle="Dépublier le contenu"
          danger
          icone={<EyeOff className="size-3.5" aria-hidden />}
          className="flex-1"
        >
          <p className="text-[13px] leading-relaxed text-ink-muted">
            « {signalement.contenu.titre} » sera retiré immédiatement de
            l&apos;application pour tous les citoyens.
          </p>
          <form action={traiterSignalement} className="mt-3">
            <input type="hidden" name="id" value={signalement.id} />
            <input type="hidden" name="action" value="DEPUBLIER" />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="w-full border-danger text-danger hover:bg-danger-pale"
              icon={<EyeOff className="size-3.5" />}
            >
              Confirmer la dépublication
            </Button>
          </form>
        </PanneauAction>
      </footer>
    </article>
  );
}
