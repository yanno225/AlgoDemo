import { Check, X } from "lucide-react";
import type { AvisEnAttente } from "@/lib/data/moderation";
import { modererAvis } from "@/lib/data/moderation-actions";
import { getThematicByLabel } from "@/lib/domain/thematics";
import { formatRelative } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { PanneauAction } from "@/components/referentiel/PanneauAction";

interface AvisCardProps {
  avis: AvisEnAttente;
  /** Décale l'entrée de la carte dans une liste en cascade. */
  index?: number;
}

/**
 * Avis citoyen en attente de modération.
 *
 * L'approbation est en un clic ; le rejet demande d'ouvrir un panneau où un
 * motif peut être joint — il sera montré au citoyen, autant qu'il explique.
 */
export function AvisCard({ avis, index = 0 }: AvisCardProps) {
  const thematic = avis.thematique
    ? getThematicByLabel(avis.thematique.libelle)
    : undefined;
  const accent = thematic
    ? `var(--color-${thematic.color})`
    : "var(--color-primary)";

  const [prenom, ...reste] = (avis.auteur ?? "Citoyen").split(" ");

  return (
    <article
      className="animate-rise relative overflow-hidden rounded-xl bg-surface p-5 shadow-sm ring-1 ring-hairline"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      {/* Liseré de thématique : le domaine se lit avant même le texte. */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: accent }}
        aria-hidden
      />

      <header className="flex items-center gap-3">
        <Avatar firstName={prenom} lastName={reste.join(" ")} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-ink">
            {avis.auteur ?? "Citoyen"}
          </p>
          <p className="text-[12px] text-ink-subtle">
            {formatRelative(avis.creeLe)}
          </p>
        </div>
        {avis.thematique && (
          <span
            className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{ color: accent }}
          >
            {avis.thematique.libelle}
          </span>
        )}
      </header>

      <blockquote className="mt-4 text-[14px] leading-relaxed text-ink">
        {avis.texte}
      </blockquote>

      <footer className="mt-4 space-y-2 border-t border-line-soft pt-4">
        <form action={modererAvis}>
          <input type="hidden" name="id" value={avis.id} />
          <input type="hidden" name="decision" value="APPROUVE" />
          <Button
            type="submit"
            size="sm"
            className="w-full"
            icon={<Check className="size-3.5" />}
          >
            Approuver et publier
          </Button>
        </form>

        <PanneauAction
          libelle="Rejeter cet avis"
          danger
          icone={<X className="size-3.5" aria-hidden />}
        >
          <form action={modererAvis} className="space-y-2">
            <input type="hidden" name="id" value={avis.id} />
            <input type="hidden" name="decision" value="REJETE" />
            <TextInput
              name="motif"
              maxLength={500}
              placeholder="Motif du rejet (montré au citoyen)"
              aria-label="Motif du rejet"
              className="h-10 text-[13px]"
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="w-full border-danger text-danger hover:bg-danger-pale"
              icon={<X className="size-3.5" />}
            >
              Confirmer le rejet
            </Button>
          </form>
        </PanneauAction>
      </footer>
    </article>
  );
}
