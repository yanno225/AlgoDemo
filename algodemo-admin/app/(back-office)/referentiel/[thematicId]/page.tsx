import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Info,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { getThematique } from "@/lib/data/referentiel";
import {
  creerCritere,
  creerIndicateur,
  renommerCritere,
  supprimerCritere,
} from "@/lib/data/referentiel-actions";
import { getThematicByLabel } from "@/lib/domain/thematics";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { PanneauAction } from "@/components/referentiel/PanneauAction";

export default async function ThematiqueDetailPage({
  params,
}: {
  // Next 16 : `params` est asynchrone.
  params: Promise<{ thematicId: string }>;
}) {
  const { thematicId } = await params;
  const thematique = await getThematique(thematicId);
  if (!thematique) notFound();

  const habillage = getThematicByLabel(thematique.libelle);
  const couleur = habillage
    ? `var(--color-${habillage.color})`
    : "var(--color-primary)";

  return (
    <>
      <Link
        href="/referentiel"
        className="mb-4 inline-flex items-center gap-2 text-[14px] font-medium text-ink-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour au référentiel
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <span
          className="size-11 shrink-0 rounded-md ring-1 ring-black/5"
          style={{ backgroundColor: couleur }}
          aria-hidden
        />
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wide text-ink-subtle">
            Thématique
          </p>
          <h1 className="font-heading text-[28px] font-bold leading-tight text-ink">
            {thematique.libelle}
          </h1>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {thematique.criteres.map((critere, index) => (
            /* `<details>` natif : accordéon accessible au clavier et
               fonctionnel sans JavaScript. */
            <details
              key={critere.id}
              open={index === 0}
              className="animate-rise group overflow-hidden rounded-xl bg-surface shadow-sm ring-1 ring-hairline"
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 p-5 transition-colors hover:bg-surface-raised [&::-webkit-details-marker]:hidden">
                <span
                  className="h-9 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: couleur }}
                  aria-hidden
                />

                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-ink">
                    {critere.libelle}
                  </span>
                  <span className="block text-[13px] text-ink-subtle">
                    {critere.indicateurs.length} indicateur
                    {critere.indicateurs.length > 1 ? "s" : ""} rattaché
                    {critere.indicateurs.length > 1 ? "s" : ""}
                  </span>
                </span>

                <ChevronDown
                  className="size-4 shrink-0 text-ink-subtle transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
              </summary>

              <div className="border-t border-line-soft px-5 pb-5 pt-4">
                {/* ─── Indicateurs ───────────────────────────────────
                    Lignes = liens purs : renommage et suppression vivent
                    sur la fiche de l'indicateur, avec tout son contexte
                    (nombre de valeurs qui disparaîtraient). */}
                <ul className="space-y-2">
                  {critere.indicateurs.map((indicateur) => (
                    <li key={indicateur.id}>
                      <Link
                        href={`/referentiel/indicateurs/${indicateur.id}`}
                        className="group/ligne flex items-center gap-3 rounded-lg bg-surface-raised p-3 transition-all duration-150 hover:-translate-y-px hover:shadow-sm"
                      >
                        <span className="min-w-0 flex-1 text-[14px] font-medium text-ink group-hover/ligne:text-primary">
                          {indicateur.libelle}
                        </span>
                        <ChevronRight
                          className="size-4 shrink-0 text-ink-subtle transition-transform duration-150 group-hover/ligne:translate-x-0.5 group-hover/ligne:text-primary"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}

                  {critere.indicateurs.length === 0 && (
                    <li className="rounded-lg bg-surface-raised p-4 text-center text-[13px] text-ink-muted">
                      Aucun indicateur — ce critère n&apos;apparaît pas encore
                      dans la fiche pays.
                    </li>
                  )}
                </ul>

                {/* ─── Ajouter un indicateur ────────────────────────── */}
                <form action={creerIndicateur} className="mt-3 flex gap-2">
                  <input type="hidden" name="critereId" value={critere.id} />
                  <TextInput
                    name="libelle"
                    required
                    maxLength={500}
                    placeholder="Nouvel indicateur (ex. Taux d'accès à l'eau potable)"
                    aria-label={`Nouvel indicateur du critère ${critere.libelle}`}
                    className="h-10 flex-1 text-[13px]"
                  />
                  <Button type="submit" size="sm" className="h-10 shrink-0" icon={<Plus className="size-3.5" />}>
                    Ajouter
                  </Button>
                </form>

                {/* ─── Gestion du critère ───────────────────────────── */}
                <div className="mt-4 flex flex-wrap items-start gap-2 border-t border-line-soft pt-3">
                  <PanneauAction libelle="Renommer" icone={<Pencil className="size-3.5" aria-hidden />}>
                    <form action={renommerCritere} className="flex gap-2">
                      <input type="hidden" name="id" value={critere.id} />
                      <TextInput
                        name="libelle"
                        required
                        maxLength={255}
                        defaultValue={critere.libelle}
                        aria-label={`Nouveau libellé du critère ${critere.libelle}`}
                        className="h-10 flex-1 text-[13px]"
                      />
                      <Button type="submit" size="sm" className="h-10 shrink-0">
                        Renommer
                      </Button>
                    </form>
                  </PanneauAction>

                  <PanneauAction
                    libelle="Supprimer"
                    danger
                    icone={<Trash2 className="size-3.5" aria-hidden />}
                  >
                    <p className="text-[13px] leading-relaxed text-ink-muted">
                      Supprimer « {critere.libelle} » emporte{" "}
                      <strong className="text-danger">
                        {critere.indicateurs.length} indicateur
                        {critere.indicateurs.length > 1 ? "s" : ""}
                      </strong>{" "}
                      et toutes leurs valeurs déjà publiées dans la fiche pays.
                      Cette action est définitive.
                    </p>
                    <form action={supprimerCritere} className="mt-3">
                      <input type="hidden" name="id" value={critere.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        className="border-danger text-danger hover:bg-danger-pale"
                        icon={<Trash2 className="size-3.5" />}
                      >
                        Supprimer définitivement
                      </Button>
                    </form>
                  </PanneauAction>
                </div>
              </div>
            </details>
          ))}

          {/* ─── Nouveau critère ─────────────────────────────────────── */}
          <div
            className="animate-rise rounded-xl border-[1.5px] border-dashed border-line bg-surface/60 p-5"
            style={{ animationDelay: `${thematique.criteres.length * 45}ms` }}
          >
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-muted">
              Nouveau critère
            </p>
            <form action={creerCritere} className="mt-3 flex gap-2">
              <input type="hidden" name="thematiqueId" value={thematique.id} />
              <TextInput
                name="libelle"
                required
                maxLength={255}
                placeholder="Libellé du critère (ex. Accès aux services essentiels)"
                aria-label="Libellé du nouveau critère"
                className="h-11 flex-1"
              />
              <Button type="submit" className="h-11 shrink-0" icon={<Plus className="size-4" />}>
                Créer
              </Button>
            </form>
          </div>
        </div>

        <Card className="bg-secondary-pale ring-1 ring-secondary/25 lg:sticky lg:top-6">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 size-[18px] shrink-0 text-secondary" aria-hidden />
            <div>
              <p className="text-[15px] font-bold text-ink">Aide à la gestion</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">
                Ces critères et indicateurs structurent la fiche pays et la
                collecte : l&apos;IA ne peut rattacher une donnée qu&apos;à un
                indicateur existant ici. Renommer un indicateur peut casser la
                correspondance avec les connecteurs (Banque Mondiale, OMS) —
                vérifiez les mappings après coup.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
