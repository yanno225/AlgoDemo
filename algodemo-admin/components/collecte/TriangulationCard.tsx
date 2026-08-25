import { CircleAlert, Layers } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { LigneTriangulation } from "@/lib/domain/types";

/**
 * Croisement des sources pour un indicateur : c'est ce qui distingue une
 * donnée vérifiée d'un chiffre isolé. Concordance = au moins deux sources
 * dont les valeurs ne s'écartent pas de plus de 10 % de la moyenne.
 */
export function TriangulationCard({
  ligne,
  index = 0,
}: {
  ligne: LigneTriangulation;
  index?: number;
}) {
  const sourceUnique = ligne.niveauVerification < 2;

  return (
    <Card
      className="animate-rise"
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-ink">{ligne.indicateur}</p>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {ligne.critere} › {ligne.thematique}
          </p>
        </div>
        <Badge tone={ligne.concordance ? "success" : sourceUnique ? "neutral" : "danger"} dot>
          {ligne.concordance
            ? "Concordantes"
            : sourceUnique
              ? "Source unique"
              : "Divergentes"}
        </Badge>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[13px] text-ink-muted">
        <Layers className="size-3.5 text-primary" aria-hidden />
        <span>
          {ligne.niveauVerification} source
          {ligne.niveauVerification > 1 ? "s" : ""} distincte
          {ligne.niveauVerification > 1 ? "s" : ""}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {ligne.sources.map((source) => (
          <li
            key={source.propositionId}
            className="flex items-baseline justify-between gap-3 rounded-lg bg-surface-raised px-3 py-2"
          >
            <span className="min-w-0 break-words text-[13px] text-ink-muted">
              {source.source.split(" — ")[0]}
            </span>
            <span className="shrink-0 text-[14px] font-bold tabular text-ink">
              {source.valeur}
              <span className="ml-1 text-[12px] font-normal text-ink-subtle">
                ({source.annee})
              </span>
            </span>
          </li>
        ))}
      </ul>

      {!ligne.concordance && !sourceUnique && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-danger-pale p-3 text-[13px] leading-relaxed text-danger">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Les sources ne concordent pas : arbitrez avant de publier l&apos;une de
          ces valeurs.
        </p>
      )}
    </Card>
  );
}
