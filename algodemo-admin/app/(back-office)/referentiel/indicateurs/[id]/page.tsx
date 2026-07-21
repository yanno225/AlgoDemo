import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Plus, Pencil, Trash2, Globe } from "lucide-react";
import { getIndicator } from "@/lib/data/referential";
import { getThematic } from "@/lib/domain/thematics";
import { formatDate } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default async function IndicateurPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getIndicator(id);

  if (!result) notFound();

  const { indicator, criterion, thematicId } = result;
  const thematic = getThematic(thematicId);

  return (
    <>
      {/* Fil d'ariane : un indicateur ne se lit qu'au regard du critère et de
          la thématique dont il dépend. */}
      <nav aria-label="Fil d'ariane" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-[13px] text-ink-subtle">
          <li>
            <Link href="/referentiel" className="transition-colors hover:text-primary">
              Référentiel
            </Link>
          </li>
          <ChevronRight className="size-3" aria-hidden />
          <li>
            <Link
              href={`/referentiel/${thematicId}`}
              className="transition-colors hover:text-primary"
            >
              {thematic?.label}
            </Link>
          </li>
          <ChevronRight className="size-3" aria-hidden />
          <li className="font-medium text-ink">{criterion.label}</li>
        </ol>
      </nav>

      <div className="mb-6">
        <Badge tone="brand" className="font-mono">{indicator.code}</Badge>
        <h1 className="mt-2 font-heading text-[28px] font-bold text-ink">
          {indicator.label}
        </h1>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink-muted">
          {indicator.description}
        </p>
      </div>

      <Card flush>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <CardHeader
            title="Valeurs enregistrées"
            description={`${indicator.entries.length} entrée${
              indicator.entries.length > 1 ? "s" : ""
            } au total, tous pays confondus.`}
            className="flex-1"
          />

          {/* TODO(backend) : POST /admin/indicators/:id/entries */}
          <Button size="sm" icon={<Plus className="size-4" />}>
            Ajouter une valeur
          </Button>
        </div>

        {indicator.entries.length === 0 ? (
          <p className="px-5 pb-8 text-center text-[14px] text-ink-muted">
            Aucune valeur n&apos;a encore été enregistrée pour cet indicateur.
          </p>
        ) : (
          <ul className="divide-y divide-line-soft border-t border-line-soft">
            {indicator.entries.map((entry, index) => (
              <li
                key={entry.id}
                className="animate-rise flex flex-wrap items-center gap-4 px-5 py-4"
                style={{ animationDelay: `${index * 35}ms` }}
              >
                <span className="w-16 shrink-0 font-heading text-[20px] font-bold text-primary">
                  {entry.value}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
                    <Globe className="size-3.5 text-ink-subtle" aria-hidden />
                    {entry.country}
                    <span className="font-normal text-ink-subtle">
                      · {formatDate(entry.recordedAt)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-subtle">
                    Source : {entry.source}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label={`Modifier la valeur ${entry.value} pour ${entry.country}`}
                    className="grid size-8 place-items-center rounded-md text-ink-subtle transition-colors hover:bg-surface-raised hover:text-primary"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Supprimer la valeur ${entry.value} pour ${entry.country}`}
                    className="grid size-8 place-items-center rounded-md text-ink-subtle transition-colors hover:bg-danger-pale hover:text-danger"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
