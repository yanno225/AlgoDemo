import { Check, Sparkles, X } from "lucide-react";
import type { TexteAValider } from "@/lib/data/moderation";
import { getThematicByLabel } from "@/lib/domain/thematics";
import { formatRelative } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { PanneauAction } from "@/components/referentiel/PanneauAction";

interface TexteIACardProps {
  texte: TexteAValider;
  /** « Synthèse » ou « Résumé de débat » — affiché en en-tête. */
  nature: string;
  actionValider: (formData: FormData) => Promise<void>;
  actionRejeter: (formData: FormData) => Promise<void>;
  index?: number;
}

/**
 * Brouillon généré par l'IA (synthèse de fiche pays, résumé de débat), en
 * attente de validation humaine — rien ne se publie sans elle.
 *
 * Le texte est directement éditable : ce qui part à la validation est ce que
 * l'admin lit dans la zone, corrections comprises. Publier, c'est signer.
 */
export function TexteIACard({
  texte,
  nature,
  actionValider,
  actionRejeter,
  index = 0,
}: TexteIACardProps) {
  const thematic = texte.thematique
    ? getThematicByLabel(texte.thematique.libelle)
    : undefined;
  const accent = thematic
    ? `var(--color-${thematic.color})`
    : "var(--color-primary)";

  return (
    <article
      className="animate-rise relative overflow-hidden rounded-xl bg-surface p-5 shadow-sm ring-1 ring-hairline"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: accent }}
        aria-hidden
      />

      <header className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-pale">
          <Sparkles className="size-4 text-primary" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-subtle">
            {nature} · brouillon IA
          </p>
          <p className="text-[15px] font-bold leading-snug text-ink">
            {texte.contexte}
          </p>
          <p className="mt-0.5 text-[12px] text-ink-subtle">
            {texte.thematique ? `${texte.thematique.libelle} · ` : ""}
            généré {formatRelative(texte.dateGeneration)}
          </p>
        </div>
      </header>

      <form action={actionValider} className="mt-4">
        <input type="hidden" name="id" value={texte.id} />
        <TextArea
          name="texteCorrige"
          defaultValue={texte.texteGenereIA}
          rows={7}
          aria-label={`Texte de la ${nature.toLowerCase()} — modifiable avant validation`}
          className="text-[13px] leading-relaxed"
        />
        <p className="mt-1.5 text-[12px] text-ink-subtle">
          Le texte ci-dessus, corrections comprises, est ce qui sera publié.
        </p>
        <Button
          type="submit"
          size="sm"
          className="mt-3 w-full"
          icon={<Check className="size-3.5" />}
        >
          Valider et publier
        </Button>
      </form>

      <PanneauAction
        libelle="Rejeter ce brouillon"
        danger
        icone={<X className="size-3.5" aria-hidden />}
        className="mt-2"
      >
        <p className="text-[13px] leading-relaxed text-ink-muted">
          Le brouillon est conservé pour traçabilité mais ne sera jamais
          publié. Une nouvelle génération restera possible.
        </p>
        <form action={actionRejeter} className="mt-3">
          <input type="hidden" name="id" value={texte.id} />
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
    </article>
  );
}
