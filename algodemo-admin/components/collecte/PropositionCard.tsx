import { Check, ExternalLink, Quote, X } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  rejeterProposition,
  validerProposition,
} from "@/lib/data/collecte-actions";
import { formatShortDate } from "@/lib/format";
import type { PropositionValeur, StatutProposition } from "@/lib/domain/types";

const STATUT_TONES: Record<StatutProposition, BadgeTone> = {
  EN_ATTENTE: "warning",
  VALIDEE: "success",
  REJETEE: "danger",
};

const STATUT_LABELS: Record<StatutProposition, string> = {
  EN_ATTENTE: "À valider",
  VALIDEE: "Validée",
  REJETEE: "Rejetée",
};

/**
 * Une valeur proposée par la collecte, avec de quoi la vérifier sans quitter
 * l'écran : la citation verbatim du document et le lien vers la source.
 *
 * Rien n'est publié tant qu'un administrateur n'a pas tranché (CDC §7).
 */
export function PropositionCard({
  proposition,
  index = 0,
}: {
  proposition: PropositionValeur;
  index?: number;
}) {
  const enAttente = proposition.statut === "EN_ATTENTE";
  const thematique = proposition.indicateur.critere?.thematique?.libelle;

  return (
    <Card
      className="animate-rise"
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-ink">
            {proposition.indicateur.libelle}
          </p>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {[proposition.indicateur.critere?.libelle, thematique]
              .filter(Boolean)
              .join(" › ") || "Rattachement inconnu"}
          </p>
        </div>
        <Badge tone={STATUT_TONES[proposition.statut]} dot>
          {STATUT_LABELS[proposition.statut]}
        </Badge>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-heading text-[28px] font-bold tabular text-primary">
          {proposition.valeur}
        </span>
        <span className="text-[13px] text-ink-muted">
          mesuré en {proposition.dateMesure.slice(0, 4)} · {proposition.paysOuZone}
        </span>
      </div>

      {/* La citation est la pièce justificative : sans elle, le chiffre n'est
          pas vérifiable et ne devrait pas être validé. */}
      {proposition.extrait ? (
        <blockquote className="mt-4 flex gap-2 border-l-[3px] border-secondary bg-secondary-pale p-4 text-[14px] leading-relaxed text-ink">
          <Quote className="mt-0.5 size-3.5 shrink-0 text-secondary" aria-hidden />
          <span>{proposition.extrait}</span>
        </blockquote>
      ) : (
        <p className="mt-4 rounded-lg bg-surface-raised p-3 text-[13px] text-ink-muted">
          Aucune citation — valeur issue d&apos;un connecteur de données ouvertes,
          la source fait foi.
        </p>
      )}

      <dl className="mt-4 space-y-1.5 text-[13px]">
        <div className="flex gap-2">
          <dt className="shrink-0 text-ink-subtle">Source</dt>
          <dd className="min-w-0 break-words text-ink">{proposition.source}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-ink-subtle">Collectée le</dt>
          <dd className="text-ink">{formatShortDate(proposition.collecteLe)}</dd>
        </div>
      </dl>

      {proposition.urlSource && (
        <a
          href={proposition.urlSource}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary underline-offset-2 hover:underline"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          Consulter le document source
        </a>
      )}

      {enAttente && (
        <div className="mt-5 flex gap-2 border-t border-line-soft pt-4">
          <form action={validerProposition} className="flex-1">
            <input type="hidden" name="id" value={proposition.id} />
            <Button
              type="submit"
              className="w-full"
              icon={<Check className="size-3.5" />}
            >
              Valider
            </Button>
          </form>
          <form action={rejeterProposition} className="flex-1">
            <input type="hidden" name="id" value={proposition.id} />
            <Button
              type="submit"
              variant="outline"
              className="w-full border-danger text-danger hover:bg-danger-pale"
              icon={<X className="size-3.5" />}
            >
              Rejeter
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}
