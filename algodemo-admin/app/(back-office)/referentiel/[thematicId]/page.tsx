import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  ChevronDown,
  Pencil,
  Trash2,
  Info,
  ChevronRight,
} from "lucide-react";
import { getThematicReferential } from "@/lib/data/referential";
import { getThematic } from "@/lib/domain/thematics";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default async function ThematicReferentialPage({
  params,
}: {
  params: Promise<{ thematicId: string }>;
}) {
  const { thematicId } = await params;
  const [entry, thematic] = [
    await getThematicReferential(thematicId),
    getThematic(thematicId),
  ];

  if (!entry || !thematic) notFound();

  return (
    <>
      <Link
        href="/referentiel"
        className="mb-4 inline-flex items-center gap-2 text-[14px] font-medium text-ink-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour au référentiel
      </Link>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="size-11 shrink-0 rounded-md"
            style={{ backgroundColor: `var(--color-${thematic.color})` }}
            aria-hidden
          />
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wide text-ink-subtle">
              Thématique
            </p>
            <h1 className="font-heading text-[28px] font-bold text-ink">
              {thematic.label}
            </h1>
          </div>
        </div>

        <Button
          href={`/referentiel/${thematicId}/criteres/nouveau`}
          icon={<Plus className="size-4" />}
        >
          Ajouter un critère
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {entry.criteria.length === 0 ? (
            <Card>
              <p className="py-8 text-center text-[14px] text-ink-muted">
                Aucun critère n&apos;est encore défini pour cette thématique.
              </p>
            </Card>
          ) : (
            entry.criteria.map((criterion, index) => (
              /* `<details>` natif : accordéon accessible au clavier et
                 fonctionnel sans JavaScript. */
              <details
                key={criterion.id}
                open={index === 0}
                className="animate-rise group overflow-hidden rounded-xl bg-surface shadow-sm ring-1 ring-hairline"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 p-6 transition-colors hover:bg-surface-raised">
                  <span
                    className="h-9 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: `var(--color-${thematic.color})` }}
                    aria-hidden
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold text-ink">
                      {criterion.label}
                    </span>
                    <span className="block text-[13px] text-ink-subtle">
                      {criterion.indicators.length} indicateur
                      {criterion.indicators.length > 1 ? "s" : ""} rattaché
                      {criterion.indicators.length > 1 ? "s" : ""}
                    </span>
                  </span>

                  <ChevronDown
                    className="size-4 shrink-0 text-ink-subtle transition-transform duration-200 group-open:rotate-180"
                    aria-hidden
                  />
                </summary>

                <div className="border-t border-line-soft px-6 pb-6 pt-4">
                  <p className="mb-4 text-[14px] leading-relaxed text-ink-muted">
                    {criterion.description}
                  </p>

                  <ul className="space-y-2">
                    {criterion.indicators.map((indicator) => (
                      <li key={indicator.id}>
                        <div className="flex items-center gap-3 rounded-lg bg-surface-raised p-3">
                          <Link
                            href={`/referentiel/indicateurs/${indicator.id}`}
                            className="group/link min-w-0 flex-1"
                          >
                            <span className="flex items-center gap-2">
                              <Badge tone="neutral" className="font-mono">{indicator.code}</Badge>
                            </span>
                            <span className="mt-1 block text-[14px] font-medium text-ink group-hover/link:text-primary">
                              {indicator.label}
                            </span>
                          </Link>

                          {/* Actions discrètes : la suppression d'un critère
                              entraîne celle de ses indicateurs. */}
                          <button
                            type="button"
                            aria-label={`Modifier ${indicator.label}`}
                            className="grid size-8 shrink-0 place-items-center rounded-md text-ink-subtle transition-colors hover:bg-surface hover:text-primary"
                          >
                            <Pencil className="size-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            aria-label={`Supprimer ${indicator.label}`}
                            className="grid size-8 shrink-0 place-items-center rounded-md text-ink-subtle transition-colors hover:bg-danger-pale hover:text-danger"
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>

                          <ChevronRight
                            className="size-4 shrink-0 text-ink-subtle"
                            aria-hidden
                          />
                        </div>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border-[1.5px] border-dashed border-line text-[14px] font-medium text-ink-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    Ajouter un indicateur
                  </button>
                </div>
              </details>
            ))
          )}
        </div>

        <Card className="h-fit bg-secondary-pale ring-1 ring-secondary/25">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 size-[18px] shrink-0 text-secondary" aria-hidden />
            <div>
              <p className="text-[15px] font-bold text-ink">Aide à la gestion</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">
                Utilisez les icônes discrètes pour modifier ou supprimer un
                élément. Toute suppression d&apos;un critère entraîne celle des
                indicateurs qui lui sont rattachés, ainsi que des valeurs déjà
                enregistrées.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
