import { Globe, Plus, Power, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { listSourcesAutorisees } from "@/lib/data/collecte";
import { ajouterSource, basculerSource } from "@/lib/data/collecte-actions";
import { cn } from "@/lib/cn";

export const metadata = { title: "Liste blanche des sources" };

export default async function SourcesPage() {
  const sources = await listSourcesAutorisees();
  const actives = sources.filter((s) => s.active);
  const inactives = sources.filter((s) => !s.active);

  return (
    <>
      <PageHeader
        title="Liste blanche des sources"
        description="Premier garde-fou de la collecte : aucun document ne peut être analysé si sa source ne figure pas ici, active."
        actions={
          <Button href="/collecte" variant="outline">
            Retour à la collecte
          </Button>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* ─── Liste ──────────────────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-primary-pale px-5 py-4 ring-1 ring-primary/15">
            <ShieldCheck
              className="size-[18px] shrink-0 text-primary"
              aria-hidden
            />
            <p className="flex-1 text-[14px] leading-relaxed text-ink-muted">
              <span className="font-bold text-primary">
                {actives.length} source{actives.length > 1 ? "s" : ""} active
                {actives.length > 1 ? "s" : ""}
              </span>
              {inactives.length > 0 && (
                <>
                  {" "}
                  · {inactives.length} désactivée
                  {inactives.length > 1 ? "s" : ""}
                </>
              )}{" "}
              — une source n&apos;est jamais supprimée, la désactiver bloque
              toute nouvelle ingestion sans effacer l&apos;historique.
            </p>
          </div>

          {/* `overflow-hidden` : sans lui, la dernière ligne de la liste
              dépasse des angles arrondis de la carte. */}
          <Card flush className="overflow-hidden">
            <CardHeader
              title="Sources référencées"
              description="Le domaine sert à reconnaître automatiquement l'URL d'un document ingéré."
              className="p-5"
            />

            <ul className="divide-y divide-line-soft border-t border-line-soft">
              {sources.map((source, index) => (
                <li
                  key={source.id}
                  className={cn(
                    "animate-rise flex flex-wrap items-start gap-x-4 gap-y-3 px-5 py-4 sm:flex-nowrap",
                    !source.active && "bg-surface-raised",
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className={cn(
                          "text-[15px] font-semibold",
                          source.active ? "text-ink" : "text-ink-muted",
                        )}
                      >
                        {source.libelle}
                      </span>
                      {source.domaine && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-surface-raised px-1.5 py-0.5 font-mono text-[11px] text-ink-muted ring-1 ring-hairline">
                          <Globe className="size-3 shrink-0" aria-hidden />
                          {source.domaine}
                        </span>
                      )}
                      {!source.active && (
                        <Badge tone="neutral">Désactivée</Badge>
                      )}
                    </div>

                    {source.description && (
                      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                        {source.description}
                      </p>
                    )}
                  </div>

                  {/* Largeur fixe : les boutons restent alignés d'une ligne à
                      l'autre malgré des libellés de longueurs différentes. */}
                  <form action={basculerSource} className="shrink-0 sm:w-[116px]">
                    <input type="hidden" name="id" value={source.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={String(!source.active)}
                    />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-center",
                        source.active
                          ? "text-ink-subtle hover:bg-danger-pale hover:text-danger"
                          : "text-primary hover:bg-primary-pale",
                      )}
                      icon={<Power className="size-3.5" />}
                    >
                      {source.active ? "Désactiver" : "Réactiver"}
                    </Button>
                  </form>
                </li>
              ))}

              {sources.length === 0 && (
                <li className="px-5 py-12 text-center text-[14px] leading-relaxed text-ink-muted">
                  Aucune source n&apos;est encore référencée. Lancez{" "}
                  <span className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-[12px]">
                    npm run seed:sources
                  </span>{" "}
                  côté backend pour charger les sources institutionnelles.
                </li>
              )}
            </ul>
          </Card>
        </div>

        {/* ─── Ajout ──────────────────────────────────────────────────
            Collée en haut au défilement : la liste est longue, le formulaire
            doit rester à portée sans remonter. */}
        <Card className="lg:sticky lg:top-6">
          <CardHeader
            title="Ajouter une source"
            description="Le libellé doit être celui sous lequel la source sera citée aux citoyens."
          />

          <form action={ajouterSource} className="mt-5 space-y-4">
            <Field label="Libellé" htmlFor="libelle" required>
              <TextInput
                id="libelle"
                name="libelle"
                required
                maxLength={255}
                placeholder="Institut National de la Statistique"
              />
            </Field>

            <Field
              label="Domaine"
              htmlFor="domaine"
              hint="Sans https:// — sert à reconnaître l'URL d'un document."
            >
              <TextInput
                id="domaine"
                name="domaine"
                maxLength={255}
                placeholder="ins.ci"
                className="font-mono"
              />
            </Field>

            <Field label="Description" htmlFor="description">
              <TextArea
                id="description"
                name="description"
                rows={3}
                placeholder="Périmètre couvert, fiabilité"
              />
            </Field>

            <Button
              type="submit"
              className="w-full"
              icon={<Plus className="size-4" />}
            >
              Ajouter à la liste blanche
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
