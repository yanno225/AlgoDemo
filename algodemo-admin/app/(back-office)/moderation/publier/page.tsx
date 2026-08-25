import Link from "next/link";
import { ArrowLeft, Clapperboard, Info, Send } from "lucide-react";
import { creerContenu } from "@/lib/data/moderation-actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { ThematicPicker } from "@/components/ui/ThematicPicker";

export const metadata = { title: "Publier un contenu" };

/**
 * Création d'un contenu du feed (vidéo, fiche, article). Le contenu naît
 * non publié : il passe par la file de vérification (3 niveaux) et ne peut
 * être publié qu'une fois VERIFIE — RG-FEED-01.
 */
const TYPES = [
  {
    value: "VIDEO",
    label: "Vidéo",
    detail: "Format immersif plein écran, lecture automatique",
  },
  {
    value: "FICHE",
    label: "Fiche",
    detail: "Synthèse pédagogique courte, lisible par TTS",
  },
  {
    value: "ARTICLE",
    label: "Article",
    detail: "Texte de fond, sources à l'appui",
  },
];

export default function PublierContenuPage() {
  return (
    <>
      <Link
        href="/moderation"
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-ink-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Retour à la modération
      </Link>

      <PageHeader
        title="Publier un contenu"
        description="Le contenu créé rejoint la file de vérification : rien ne paraît dans l'application sans le statut « Vérifié »."
      />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form action={creerContenu} className="space-y-5">
            <Field label="Type" required>
              <div className="grid gap-2 sm:grid-cols-3">
                {TYPES.map((type, index) => (
                  <label
                    key={type.value}
                    className="flex cursor-pointer flex-col gap-1 rounded-lg bg-surface-raised px-4 py-3 ring-1 ring-hairline transition-all has-[:checked]:bg-primary-pale has-[:checked]:ring-primary"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        defaultChecked={index === 0}
                        className="accent-[var(--color-primary)]"
                      />
                      <span className="text-[14px] font-semibold text-ink">
                        {type.label}
                      </span>
                    </span>
                    <span className="text-[12px] leading-snug text-ink-muted">
                      {type.detail}
                    </span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Thématique" required>
              <ThematicPicker name="thematique" />
            </Field>

            <Field label="Titre" htmlFor="titre" required>
              <TextInput
                id="titre"
                name="titre"
                required
                maxLength={255}
                placeholder="Le vote à bulletin secret, comment ça marche ?"
              />
            </Field>

            <Field
              label="Corps"
              htmlFor="corps"
              required
              hint="Ce texte porte la lecture audio (TTS) et l'accessibilité : il doit se suffire à lui-même, même sans le média."
            >
              <TextArea
                id="corps"
                name="corps"
                rows={6}
                required
                placeholder="Le contenu pédagogique complet, en français simple…"
              />
            </Field>

            <Field
              label="Média"
              htmlFor="media"
              hint="Vidéo MP4/WebM ou image — c'est lui qui s'affiche en plein écran dans le feed. Facultatif pour une fiche ou un article."
            >
              <label
                htmlFor="media"
                className="flex cursor-pointer items-center gap-3 rounded-lg border-[1.5px] border-dashed border-line bg-surface-raised px-4 py-3 text-[14px] text-ink-muted transition-colors hover:border-primary hover:text-primary"
              >
                <Clapperboard className="size-4 shrink-0" aria-hidden />
                Choisir un fichier…
                <input
                  id="media"
                  name="media"
                  type="file"
                  accept="video/mp4,video/webm,image/jpeg,image/png,image/webp"
                  className="flex-1 text-[13px] file:hidden"
                />
              </label>
            </Field>

            <Field
              label="Source"
              htmlFor="source"
              hint="Exigence de traçabilité : d'où vient l'information (et le média, avec sa licence le cas échéant)."
            >
              <TextInput
                id="source"
                name="source"
                maxLength={500}
                placeholder="CEI · Vidéo : Wikimedia Commons, CC BY-SA (auteur)…"
              />
            </Field>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-surface-raised px-4 py-3 ring-1 ring-hairline">
              <input
                type="checkbox"
                name="officiel"
                className="accent-[var(--color-primary)]"
              />
              <span className="text-[14px] text-ink">
                Contenu officiel de la plateforme
                <span className="block text-[12px] text-ink-muted">
                  Affiche le badge officiel dans l&apos;application.
                </span>
              </span>
            </label>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              icon={<Send className="size-4" />}
            >
              Créer et envoyer en vérification
            </Button>
          </form>
        </Card>

        <Card className="bg-secondary-pale ring-1 ring-secondary/25 lg:sticky lg:top-6">
          <CardHeader title="Le circuit de publication" />
          <div className="mt-3 flex items-start gap-3">
            <Info className="mt-0.5 size-[18px] shrink-0 text-secondary" aria-hidden />
            <p className="text-[14px] leading-relaxed text-ink-muted">
              1. Le contenu est créé <strong className="text-ink">non publié</strong>.
              <br />
              2. Il apparaît dans l&apos;onglet « Vérifications » où l&apos;équipe fait
              monter son niveau (non vérifié → partiellement → vérifié).
              <br />
              3. Le bouton <strong className="text-ink">Publier</strong> ne
              s&apos;ouvre qu&apos;au statut « Vérifié » — alors seulement il
              paraît dans le feed des citoyens.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
