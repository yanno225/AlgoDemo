import { Check, X } from "lucide-react";
import type { Contribution } from "@/lib/domain/types";
import { getThematic } from "@/lib/domain/thematics";
import { formatRelative } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

interface ContributionCardProps {
  contribution: Contribution;
  /** Décale l'entrée de la carte dans une liste en cascade. */
  index?: number;
}

/**
 * Avis citoyen soumis à modération.
 *
 * Le contexte (consultation ou débat d'origine) est affiché au-dessus du
 * texte : un avis jugé hors de son contexte est un avis mal modéré.
 */
export function ContributionCard({ contribution, index = 0 }: ContributionCardProps) {
  const thematic = getThematic(contribution.thematicId);
  const accent = thematic ? `var(--color-${thematic.color})` : "var(--color-primary)";

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
        <Avatar
          firstName={contribution.author.firstName}
          lastName={contribution.author.lastName}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-ink">
            {contribution.author.firstName} {contribution.author.lastName}
          </p>
          <p className="text-[12px] text-ink-subtle">
            {formatRelative(contribution.submittedAt)}
          </p>
        </div>
        {thematic && (
          <span
            className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{ color: accent }}
          >
            {thematic.label}
          </span>
        )}
      </header>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-subtle">
        Contexte · {contribution.context}
      </p>

      <blockquote className="mt-1.5 text-[14px] leading-relaxed text-ink">
        {contribution.body}
      </blockquote>

      <footer className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          icon={<X className="size-3.5" />}
          className="flex-1 border-danger text-danger hover:bg-danger-pale"
        >
          Rejeter
        </Button>
        <Button size="sm" icon={<Check className="size-3.5" />} className="flex-1">
          Valider
        </Button>
      </footer>
    </article>
  );
}
