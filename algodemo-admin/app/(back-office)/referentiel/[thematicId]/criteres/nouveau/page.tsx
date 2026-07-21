import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Lightbulb, Save } from "lucide-react";
import { getThematic } from "@/lib/domain/thematics";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, TextInput, TextArea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Nouveau critère" };

export default async function NouveauCriterePage({
  params,
}: {
  params: Promise<{ thematicId: string }>;
}) {
  const { thematicId } = await params;
  const thematic = getThematic(thematicId);

  if (!thematic) notFound();

  return (
    <>
      <Link
        href={`/referentiel/${thematicId}`}
        className="mb-4 inline-flex items-center gap-2 text-[14px] font-medium text-ink-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour à {thematic.label}
      </Link>

      <h1 className="mb-1 font-heading text-[28px] font-bold text-ink">
        Nouveau critère
      </h1>
      <p className="mb-6 max-w-2xl text-[15px] text-ink-muted">
        Configurez les détails du critère de performance pour le suivi
        institutionnel.
      </p>

      {/* TODO(backend) : POST /admin/referential/:thematicId/criteria */}
      <form className="grid max-w-3xl gap-4">
        <Card>
          <CardHeader title="Définition" />

          <div className="mt-5 space-y-5">
            <Field
              label="Thématique parente"
              htmlFor="thematique"
              hint="Ce champ est rattaché à la thématique courante et ne peut pas être modifié."
            >
              <div className="relative">
                <TextInput
                  id="thematique"
                  value={thematic.label}
                  readOnly
                  disabled
                  className="pr-11 opacity-70"
                />
                <Lock
                  className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
                  aria-hidden
                />
              </div>
            </Field>

            <Field label="Nom du critère" htmlFor="nom" required>
              <TextInput
                id="nom"
                name="nom"
                placeholder="Ex. : Fréquence des publications"
                required
              />
            </Field>

            <Field
              label="Description courte"
              htmlFor="description"
              hint="Expliquez ce que mesure ce critère et pourquoi il compte."
            >
              <TextArea
                id="description"
                name="description"
                rows={4}
                placeholder="Décrivez l'objectif de ce critère et son importance stratégique…"
              />
            </Field>
          </div>
        </Card>

        <Card className="bg-secondary-pale ring-1 ring-secondary/25">
          <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-muted">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-secondary" aria-hidden />
            <span>
              <strong className="text-ink">Astuce</strong> — un nom précis
              facilite la lecture des rapports consolidés en fin d&apos;année,
              et la comparaison entre les pays du programme.
            </span>
          </p>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" icon={<Save className="size-4" />}>
            Enregistrer le critère
          </Button>
          <Button href={`/referentiel/${thematicId}`} variant="outline">
            Annuler
          </Button>
        </div>
      </form>
    </>
  );
}
