import Link from "next/link";
import { ArrowLeft, CalendarClock, BadgeCheck, Info } from "lucide-react";
import { listSpeakers } from "@/lib/data/debates";
import { getSession } from "@/lib/auth/session";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, TextInput, TextArea } from "@/components/ui/Field";
import { ThematicPicker } from "@/components/ui/ThematicPicker";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

export const metadata = { title: "Nouveau débat" };

export default async function NouveauDebatPage() {
  const [speakers, session] = await Promise.all([listSpeakers(), getSession()]);

  return (
    <>
      <Link
        href="/debats"
        className="mb-4 inline-flex items-center gap-2 text-[14px] font-medium text-ink-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour aux débats
      </Link>

      <h1 className="mb-6 font-heading text-[28px] font-bold text-ink">Nouveau débat</h1>

      {/* TODO(backend) : POST /admin/debates puis envoi des invitations. */}
      <form className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Cadrage du débat" />

            <div className="mt-5 space-y-5">
              <Field label="Thématique du débat" required>
                <ThematicPicker name="thematique" />
              </Field>

              <Field label="Titre du débat" htmlFor="titre" required>
                <TextInput
                  id="titre"
                  name="titre"
                  placeholder="Entrez un titre percutant…"
                  required
                />
              </Field>

              <Field
                label="Description / contexte"
                htmlFor="description"
                hint="Ce texte est affiché aux citoyens avant le démarrage du direct."
              >
                <TextArea
                  id="description"
                  name="description"
                  rows={5}
                  placeholder="Décrivez les enjeux et le cadre du débat pour les participants…"
                />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Intervenants certifiés"
              description="Seuls les experts certifiés par le Laboratoire peuvent intervenir en direct."
            />

            <ul className="mt-5 space-y-2">
              {speakers.map((speaker) => (
                <li key={speaker.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-surface-raised p-3 ring-1 ring-line-soft transition-colors hover:ring-line">
                    <input
                      type="checkbox"
                      name="intervenants"
                      value={speaker.id}
                      className="size-4 shrink-0 accent-[var(--color-primary)]"
                    />
                    <Avatar
                      firstName={speaker.name.split(" ")[0] ?? "?"}
                      lastName={speaker.name.split(" ").slice(-1)[0] ?? "?"}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold text-ink">
                        {speaker.name}
                      </span>
                      <span className="block text-[12px] text-ink-subtle">
                        {speaker.expertise}
                      </span>
                    </span>
                    {speaker.isCertified && (
                      <BadgeCheck className="size-4 shrink-0 text-success" aria-hidden />
                    )}
                  </label>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Programmation" />

            <div className="mt-5 space-y-5">
              <Field label="Date" htmlFor="date" required>
                <TextInput id="date" name="date" type="date" required />
              </Field>

              <Field label="Heure de début" htmlFor="heure" required>
                <TextInput id="heure" name="heure" type="time" required />
              </Field>

              <Field
                label="Modérateur désigné"
                htmlFor="moderateur"
                hint="Un administrateur du Laboratoire doit animer chaque débat."
                required
              >
                <TextInput
                  id="moderateur"
                  name="moderateur"
                  defaultValue={
                    session ? `${session.firstName} ${session.lastName}` : ""
                  }
                  required
                />
              </Field>
            </div>
          </Card>

          <Card className="bg-secondary-pale ring-1 ring-secondary/25">
            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-muted">
              <Info className="mt-0.5 size-3.5 shrink-0 text-secondary" aria-hidden />
              L&apos;invitation sera envoyée automatiquement aux intervenants
              sélectionnés dès la planification.
            </p>
          </Card>

          <Button
            type="submit"
            className="w-full"
            icon={<CalendarClock className="size-4" />}
          >
            Planifier le débat
          </Button>
        </div>
      </form>
    </>
  );
}
