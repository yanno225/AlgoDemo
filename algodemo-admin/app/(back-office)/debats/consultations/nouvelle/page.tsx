import Link from "next/link";
import { ArrowLeft, Info, Vote } from "lucide-react";
import { creerConsultation } from "@/lib/data/debats-actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, TextArea, TextInput } from "@/components/ui/Field";

export const metadata = { title: "Nouvelle consultation" };

/**
 * Quatre champs d'option (deux obligatoires) : le cas nominal — Pour /
 * Contre / Abstention — tient sans JavaScript ni liste dynamique.
 */
const OPTIONS = [
  { name: "option-1", placeholder: "Pour", required: true },
  { name: "option-2", placeholder: "Contre", required: true },
  { name: "option-3", placeholder: "Abstention (facultatif)", required: false },
  { name: "option-4", placeholder: "Autre option (facultatif)", required: false },
];

export default function NouvelleConsultationPage() {
  return (
    <>
      <Link
        href="/debats?onglet=consultations"
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-ink-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Retour aux consultations
      </Link>

      <PageHeader
        title="Nouvelle consultation"
        description="Un vote citoyen à bulletin secret : personne — pas même l'administration — ne peut relier un votant à son choix."
      />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form action={creerConsultation} className="space-y-5">
            <Field
              label="Type"
              required
              hint="Même vote à bulletin secret dans les deux cas — le sondage est une question rapide, affichée dans son propre onglet de l'application."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-surface-raised px-4 py-3 ring-1 ring-hairline transition-all has-[:checked]:bg-primary-pale has-[:checked]:ring-primary">
                  <input
                    type="radio"
                    name="type"
                    value="CONSULTATION"
                    defaultChecked
                    className="accent-[var(--color-primary)]"
                  />
                  <span>
                    <span className="block text-[14px] font-semibold text-ink">
                      Consultation
                    </span>
                    <span className="block text-[12px] text-ink-muted">
                      Projet de loi ou texte vulgarisé
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-surface-raised px-4 py-3 ring-1 ring-hairline transition-all has-[:checked]:bg-primary-pale has-[:checked]:ring-primary">
                  <input
                    type="radio"
                    name="type"
                    value="SONDAGE"
                    className="accent-[var(--color-primary)]"
                  />
                  <span>
                    <span className="block text-[14px] font-semibold text-ink">
                      Sondage
                    </span>
                    <span className="block text-[12px] text-ink-muted">
                      Question rapide à la communauté
                    </span>
                  </span>
                </label>
              </div>
            </Field>

            <Field label="Titre" htmlFor="titre" required>
              <TextInput
                id="titre"
                name="titre"
                required
                maxLength={255}
                placeholder="Faut-il rendre le vote obligatoire aux élections locales ?"
              />
            </Field>

            <Field label="Description" htmlFor="description" required>
              <TextArea
                id="description"
                name="description"
                rows={4}
                required
                placeholder="Le contexte complet de la question posée aux citoyens."
              />
            </Field>

            <Field
              label="Résumé vulgarisé"
              htmlFor="resume"
              required
              hint="RG-CON-09 : l'enjeu expliqué simplement, lisible par toutes et tous."
            >
              <TextArea
                id="resume"
                name="resume"
                rows={3}
                required
                maxLength={600}
                placeholder="En deux phrases : de quoi s'agit-il, et qu'est-ce que ça changerait ?"
              />
            </Field>

            <Field
              label="Options de vote"
              required
              hint="Au moins deux. Les options ne sont plus modifiables après création — intégrité du scrutin."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {OPTIONS.map((option) => (
                  <TextInput
                    key={option.name}
                    name={option.name}
                    required={option.required}
                    maxLength={255}
                    placeholder={option.placeholder}
                    aria-label={`Option de vote ${option.name.split("-")[1]}`}
                  />
                ))}
              </div>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Ouverture" htmlFor="ouverture" required>
                <TextInput id="ouverture" name="ouverture" type="date" required />
              </Field>
              <Field
                label="Clôture"
                htmlFor="cloture"
                required
                hint="Le vote ferme à 23 h 59 ce jour-là."
              >
                <TextInput id="cloture" name="cloture" type="date" required />
              </Field>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              icon={<Vote className="size-4" />}
            >
              Ouvrir la consultation
            </Button>
          </form>
        </Card>

        <Card className="bg-secondary-pale ring-1 ring-secondary/25 lg:sticky lg:top-6">
          <CardHeader title="Le secret du vote" />
          <div className="mt-3 flex items-start gap-3">
            <Info className="mt-0.5 size-[18px] shrink-0 text-secondary" aria-hidden />
            <p className="text-[14px] leading-relaxed text-ink-muted">
              L&apos;émargement (qui a voté) et l&apos;urne (ce qui a été voté)
              sont enregistrés séparément, sans lien entre eux. Les résultats
              restent invisibles des citoyens tant que vous ne les publiez pas
              depuis la liste des consultations.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
