import Link from "next/link";
import { ChevronRight, Library, Lock } from "lucide-react";
import { arbre } from "@/lib/data/referentiel";
import { getThematicByLabel } from "@/lib/domain/thematics";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Référentiel" };

export default async function ReferentielPage() {
  const thematiques = await arbre();

  const totalCriteres = thematiques.reduce(
    (somme, thematique) => somme + thematique.criteres.length,
    0,
  );
  const totalIndicateurs = thematiques.reduce(
    (somme, thematique) =>
      somme +
      thematique.criteres.reduce(
        (sousTotal, critere) => sousTotal + critere.indicateurs.length,
        0,
      ),
    0,
  );

  return (
    <>
      <PageHeader
        title="Référentiel"
        description={`La grille d'analyse commune à tous les pays du programme : ${totalCriteres} critères et ${totalIndicateurs} indicateurs issus des ateliers.`}
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl bg-primary-pale p-4 ring-1 ring-primary/15">
        <Library className="mt-0.5 size-[18px] shrink-0 text-primary" aria-hidden />
        <p className="text-[14px] leading-relaxed text-ink-muted">
          Les cinq thématiques sont <strong className="text-ink">fixes</strong> et
          ne peuvent être modifiées sans accord du comité de pilotage (RG-THE-01).
          Seuls les critères et indicateurs qu&apos;elles portent sont
          administrables.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {thematiques.map((thematique, index) => {
          const habillage = getThematicByLabel(thematique.libelle);
          const nbIndicateurs = thematique.criteres.reduce(
            (somme, critere) => somme + critere.indicateurs.length,
            0,
          );

          return (
            <Link
              key={thematique.id}
              href={`/referentiel/${thematique.id}`}
              className="group animate-rise"
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="size-10 shrink-0 rounded-md ring-1 ring-black/5"
                    style={{
                      backgroundColor: habillage
                        ? `var(--color-${habillage.color})`
                        : "var(--color-primary)",
                    }}
                    aria-hidden
                  />
                  <Badge tone="neutral">
                    <Lock className="size-2.5" aria-hidden />
                    Fixe
                  </Badge>
                </div>

                <h2 className="mt-4 font-heading text-[15px] font-bold text-ink group-hover:text-primary">
                  {thematique.libelle}
                </h2>

                <dl className="mt-4 flex gap-6 border-t border-line-soft pt-4">
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                      Critères
                    </dt>
                    <dd className="mt-0.5 font-heading text-[22px] font-bold text-ink">
                      {thematique.criteres.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                      Indicateurs
                    </dt>
                    <dd className="mt-0.5 font-heading text-[22px] font-bold text-ink">
                      {nbIndicateurs}
                    </dd>
                  </div>

                  <ChevronRight
                    className="ml-auto mt-2 size-4 self-start text-ink-subtle transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden
                  />
                </dl>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
