import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChartLine,
  ChevronRight,
  Database,
  Pencil,
  Trash2,
} from "lucide-react";
import { getIndicateur, getValeursIndicateur } from "@/lib/data/referentiel";
import {
  renommerIndicateur,
  supprimerIndicateur,
} from "@/lib/data/referentiel-actions";
import { getThematicByLabel } from "@/lib/domain/thematics";
import { formatShortDate } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { PanneauAction } from "@/components/referentiel/PanneauAction";

export default async function IndicateurPage({
  params,
}: {
  // Next 16 : `params` est asynchrone.
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contexte, valeurs] = await Promise.all([
    getIndicateur(id),
    getValeursIndicateur(id),
  ]);
  if (!contexte) notFound();

  const { thematique, critere, indicateur } = contexte;
  const habillage = getThematicByLabel(thematique.libelle);
  const couleur = habillage
    ? `var(--color-${habillage.color})`
    : "var(--color-primary)";

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
              href={`/referentiel/${thematique.id}`}
              className="transition-colors hover:text-primary"
            >
              {thematique.libelle}
            </Link>
          </li>
          <ChevronRight className="size-3" aria-hidden />
          <li className="font-medium text-ink">{critere.libelle}</li>
        </ol>
      </nav>

      <div className="mb-8 flex items-start gap-3">
        <span
          className="mt-1.5 h-9 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: couleur }}
          aria-hidden
        />
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wide text-ink-subtle">
            Indicateur
          </p>
          <h1 className="max-w-3xl font-heading text-[26px] font-bold leading-tight text-ink">
            {indicateur.libelle}
          </h1>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* ─── Valeurs publiées ────────────────────────────────────── */}
        <Card flush className="overflow-hidden lg:col-span-2">
          <CardHeader
            title="Valeurs publiées"
            description="Ce que la fiche pays affiche aux citoyens — issues de la collecte, après validation humaine."
            className="p-5"
            action={
              <Badge tone={valeurs.length > 0 ? "brand" : "neutral"}>
                <ChartLine className="size-2.5" aria-hidden />
                {valeurs.length} valeur{valeurs.length > 1 ? "s" : ""}
              </Badge>
            }
          />

          {valeurs.length > 0 ? (
            <div className="overflow-x-auto border-t border-line-soft">
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="border-b border-line-soft bg-surface-raised text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                    <th className="px-5 py-3">Pays / zone</th>
                    <th className="px-5 py-3">Valeur</th>
                    <th className="px-5 py-3">Mesure</th>
                    <th className="px-5 py-3">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {valeurs.map((valeur, index) => (
                    <tr
                      key={valeur.id}
                      className="animate-rise transition-colors hover:bg-surface-raised"
                      style={{ animationDelay: `${index * 25}ms` }}
                    >
                      <td className="px-5 py-3 font-medium text-ink">
                        {valeur.paysOuZone}
                      </td>
                      <td className="px-5 py-3 font-heading text-[16px] font-bold tabular text-primary">
                        {valeur.valeur}
                      </td>
                      <td className="px-5 py-3 text-ink-muted">
                        {formatShortDate(valeur.dateMesure)}
                      </td>
                      <td className="max-w-[220px] truncate px-5 py-3 text-[13px] text-ink-subtle">
                        {valeur.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border-t border-line-soft px-5 py-12 text-center">
              <Database className="mx-auto size-6 text-ink-subtle" aria-hidden />
              <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ink-muted">
                Aucune valeur publiée pour le moment. Les valeurs arrivent par
                la <Link href="/collecte" className="font-semibold text-primary hover:underline">collecte</Link>{" "}
                — proposition, triangulation, puis validation humaine.
              </p>
            </div>
          )}
        </Card>

        {/* ─── Gestion ─────────────────────────────────────────────── */}
        <Card className="lg:sticky lg:top-6">
          <CardHeader
            title="Gestion"
            description="L'IA ne rattache une donnée qu'aux indicateurs de cette liste."
          />

          <div className="mt-4 space-y-2">
            <PanneauAction
              libelle="Renommer l'indicateur"
              icone={<Pencil className="size-3.5" aria-hidden />}
            >
              <p className="text-[13px] leading-relaxed text-ink-muted">
                Les connecteurs (Banque Mondiale, OMS) se repèrent au libellé
                exact — vérifiez leurs mappings après un renommage.
              </p>
              <form action={renommerIndicateur} className="mt-3 space-y-2">
                <input type="hidden" name="id" value={indicateur.id} />
                <TextInput
                  name="libelle"
                  required
                  maxLength={500}
                  defaultValue={indicateur.libelle}
                  aria-label="Nouveau libellé de l'indicateur"
                  className="h-10 text-[13px]"
                />
                <Button type="submit" size="sm" className="w-full">
                  Renommer
                </Button>
              </form>
            </PanneauAction>

            <PanneauAction
              libelle="Supprimer l'indicateur"
              danger
              icone={<Trash2 className="size-3.5" aria-hidden />}
            >
              <p className="text-[13px] leading-relaxed text-ink-muted">
                Suppression définitive :{" "}
                <strong className="text-danger">
                  {valeurs.length} valeur{valeurs.length > 1 ? "s" : ""} publiée
                  {valeurs.length > 1 ? "s" : ""}
                </strong>{" "}
                et toutes les propositions de collecte associées disparaîtront
                de la fiche pays.
              </p>
              <form action={supprimerIndicateur} className="mt-3">
                <input type="hidden" name="id" value={indicateur.id} />
                <input
                  type="hidden"
                  name="retour"
                  value={`/referentiel/${thematique.id}`}
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="w-full border-danger text-danger hover:bg-danger-pale"
                  icon={<Trash2 className="size-3.5" />}
                >
                  Supprimer définitivement
                </Button>
              </form>
            </PanneauAction>
          </div>
        </Card>
      </div>
    </>
  );
}
