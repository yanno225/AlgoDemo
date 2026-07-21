import Link from "next/link";
import { ArrowLeft, Rocket, Info, FileSearch, CalendarRange } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, TextInput, TextArea } from "@/components/ui/Field";
import { ThematicPicker } from "@/components/ui/ThematicPicker";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Nouvelle consultation" };

const SUMMARY_MAX = 600;

export default function NouvelleConsultationPage() {
  return (
    <>
      <Link
        href="/debats?onglet=consultations"
        className="mb-4 inline-flex items-center gap-2 text-[14px] font-medium text-ink-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour aux consultations
      </Link>

      <h1 className="mb-6 font-heading text-[28px] font-bold text-ink">
        Nouvelle consultation
      </h1>

      {/* TODO(backend) : POST /admin/consultations */}
      <form className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Objet de la consultation" />

            <div className="mt-5 space-y-5">
              <Field
                label="Thématique"
                hint="Une consultation peut porter sur plusieurs thématiques (RG-CON-02)."
                required
              >
                <ThematicPicker name="thematiques" multiple />
              </Field>

              <Field label="Titre de la consultation" htmlFor="titre" required>
                <TextInput
                  id="titre"
                  name="titre"
                  placeholder="Ex. : Impact de la transition énergétique…"
                  required
                />
              </Field>

              <Field
                label="Résumé vulgarisé"
                htmlFor="resume"
                hint={
                  <>
                    RG-CON-09 · Ce résumé est lu par tous les citoyens, y compris
                    peu alphabétisés. Privilégiez des phrases courtes et
                    concrètes. {SUMMARY_MAX} caractères maximum.
                  </>
                }
                required
              >
                <TextArea
                  id="resume"
                  name="resume"
                  rows={6}
                  maxLength={SUMMARY_MAX}
                  placeholder="Décrivez les enjeux de cette consultation de manière accessible à tous les citoyens…"
                  required
                />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Projet de loi rattaché"
              description="Le document de référence consultable par les citoyens depuis l'application."
            />

            <div className="mt-5">
              <Field label="Rechercher un document" htmlFor="projet">
                <TextInput
                  id="projet"
                  name="projet"
                  placeholder="Rechercher un document ou un texte de loi…"
                />
              </Field>

              <p className="mt-3 flex items-center gap-2 rounded-lg bg-surface-raised p-3 text-[13px] text-ink-subtle">
                <FileSearch className="size-3.5 shrink-0" aria-hidden />
                Aucun document sélectionné pour l&apos;instant.
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Période de vote" />

            <div className="mt-5 space-y-5">
              <Field label="Ouverture" htmlFor="ouverture" required>
                <TextInput id="ouverture" name="ouverture" type="date" required />
              </Field>

              <Field label="Clôture" htmlFor="cloture" required>
                <TextInput id="cloture" name="cloture" type="date" required />
              </Field>
            </div>

            <p className="mt-4 flex items-start gap-2 rounded-lg bg-secondary-pale p-3 text-[13px] leading-relaxed text-ink-muted ring-1 ring-secondary/25">
              <Info className="mt-0.5 size-3.5 shrink-0 text-secondary" aria-hidden />
              Les votes sont automatiquement bloqués en dehors de cette période.
              Un citoyen ne peut voter qu&apos;une seule fois.
            </p>
          </Card>

          <Card className="bg-primary-pale ring-1 ring-primary/15">
            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-muted">
              <CalendarRange className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
              Une fois lancée, la consultation apparaît immédiatement dans
              l&apos;onglet Participation de l&apos;application mobile.
            </p>
          </Card>

          <Button type="submit" className="w-full" icon={<Rocket className="size-4" />}>
            Lancer la consultation
          </Button>
        </div>
      </form>
    </>
  );
}
