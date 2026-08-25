import Link from "next/link";
import { ArrowLeft, CalendarPlus, ImageIcon, Info } from "lucide-react";
import { creerDebat } from "@/lib/data/debats-actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { ThematicPicker } from "@/components/ui/ThematicPicker";

export const metadata = { title: "Planifier un débat" };

export default function NouveauDebatPage() {
  return (
    <>
      <Link
        href="/debats"
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-ink-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Retour aux débats
      </Link>

      <PageHeader
        title="Planifier un débat"
        description="Le direct démarre quand vous le décidez — plusieurs débats peuvent être menés en parallèle."
      />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form action={creerDebat} className="space-y-5">
            <Field label="Thématique" required>
              <ThematicPicker name="thematique" />
            </Field>

            <Field label="Titre" htmlFor="titre" required>
              <TextInput
                id="titre"
                name="titre"
                required
                maxLength={255}
                placeholder="La participation des jeunes aux élections de 2026"
              />
            </Field>

            <Field
              label="Description"
              htmlFor="description"
              hint="L'ordre du jour, visible des citoyens avant le direct."
            >
              <TextArea
                id="description"
                name="description"
                rows={4}
                placeholder="Les points qui seront abordés, les invités attendus…"
              />
            </Field>

            <Field
              label="Image de couverture"
              htmlFor="couverture"
              hint="C'est elle qui distingue ce live des autres directs simultanés dans l'application. JPG ou PNG."
            >
              <label
                htmlFor="couverture"
                className="flex cursor-pointer items-center gap-3 rounded-lg border-[1.5px] border-dashed border-line bg-surface-raised px-4 py-3 text-[14px] text-ink-muted transition-colors hover:border-primary hover:text-primary"
              >
                <ImageIcon className="size-4 shrink-0" aria-hidden />
                Choisir une image…
                <input
                  id="couverture"
                  name="couverture"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="flex-1 text-[13px] file:hidden"
                />
              </label>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Date" htmlFor="date" required>
                <TextInput id="date" name="date" type="date" required />
              </Field>
              <Field label="Heure" htmlFor="heure" required>
                <TextInput id="heure" name="heure" type="time" required />
              </Field>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              icon={<CalendarPlus className="size-4" />}
            >
              Planifier le débat
            </Button>
          </form>
        </Card>

        <Card className="bg-secondary-pale ring-1 ring-secondary/25 lg:sticky lg:top-6">
          <CardHeader title="Comment ça marche" />
          <div className="mt-3 flex items-start gap-3">
            <Info className="mt-0.5 size-[18px] shrink-0 text-secondary" aria-hidden />
            <p className="text-[14px] leading-relaxed text-ink-muted">
              Le débat est créé <strong className="text-ink">planifié</strong> :
              les citoyens le voient dans « Prochainement ». Le direct ne
              commence que lorsque vous appuyez sur « Démarrer » — l'application
              mobile bascule alors instantanément le débat dans les lives en
              cours. Vous êtes désigné modérateur par défaut ; les affirmations
              soumises au vote se créent pendant le direct.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
