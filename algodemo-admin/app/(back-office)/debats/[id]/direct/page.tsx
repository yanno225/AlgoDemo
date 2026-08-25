import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Play, Radio, Square } from "lucide-react";
import {
  getDebatAdmin,
  listSignalements,
  type DebatAdmin,
  type SignalementAdmin,
} from "@/lib/data/debats";
import { cloturerDebat, demarrerDebat } from "@/lib/data/debats-actions";
import { requireSectionAccess } from "@/lib/auth/guard";
import { readSession } from "@/lib/auth/session";
import { API_BASE_URL } from "@/lib/api/client";
import { formatDate, formatTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConsoleDirect } from "@/components/debats/ConsoleDirect";

export const metadata = { title: "Console du direct" };

/**
 * Console de gestion d'un live : la même salle temps réel que les mobiles,
 * côté staff. Le jeton d'accès de l'admin est transmis au composant client
 * pour le handshake socket — c'est le jeton de sa propre session, exposé à
 * son propre navigateur uniquement.
 */
export default async function ConsoleDirectPage({
  params,
}: {
  // Next 16 : `params` est asynchrone.
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireSectionAccess("/debats");

  let debat: DebatAdmin;
  try {
    debat = await getDebatAdmin(id);
  } catch {
    notFound();
  }

  const [session, signalements] = await Promise.all([
    readSession(),
    listSignalements(id).catch((): SignalementAdmin[] => []),
  ]);

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
        title={debat.titre}
        description={
          debat.thematique
            ? `${debat.thematique.libelle} · prévu le ${formatDate(debat.dateDebut)} à ${formatTime(debat.dateDebut)}`
            : `Prévu le ${formatDate(debat.dateDebut)} à ${formatTime(debat.dateDebut)}`
        }
        actions={
          debat.statut === "EN_COURS" ? (
            <form action={cloturerDebat}>
              <input type="hidden" name="id" value={debat.id} />
              <Button
                type="submit"
                variant="outline"
                className="border-danger text-danger hover:bg-danger-pale"
                icon={<Square className="size-4" />}
              >
                Clôturer le direct
              </Button>
            </form>
          ) : undefined
        }
      />

      {debat.statut === "EN_COURS" ? (
        <ConsoleDirect
          debat={debat}
          jeton={session?.accessToken ?? ""}
          urlApi={API_BASE_URL}
          signalementsInitiaux={signalements}
        />
      ) : (
        <Card className="mx-auto max-w-lg text-center">
          <Radio className="mx-auto size-8 text-ink-subtle" aria-hidden />
          <p className="mt-3 text-[15px] font-semibold text-ink">
            {debat.statut === "PLANIFIE"
              ? "Ce débat n'a pas encore démarré."
              : "Ce direct est terminé."}
          </p>
          <p className="mt-1 text-[14px] text-ink-muted">
            {debat.statut === "PLANIFIE"
              ? "Démarrez le direct pour ouvrir la salle : l'application mobile bascule instantanément."
              : "La salle est close — le résumé se gère depuis la modération."}
          </p>
          {debat.statut === "PLANIFIE" && (
            <form action={demarrerDebat} className="mt-5">
              <input type="hidden" name="id" value={debat.id} />
              <Button type="submit" icon={<Play className="size-4" />}>
                Démarrer le direct
              </Button>
            </form>
          )}
        </Card>
      )}
    </>
  );
}
