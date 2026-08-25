/* eslint-disable @next/next/no-img-element */
import {
  CheckCircle2,
  ExternalLink,
  Inbox,
  MapPin,
  Megaphone,
  Play,
  XCircle,
} from "lucide-react";
import {
  LIBELLES_CATEGORIES,
  listSignalementsCitoyens,
  type SignalementCitoyenAdmin,
} from "@/lib/data/signalements-citoyens";
import { changerStatutSignalement } from "@/lib/data/signalements-citoyens-actions";
import { urlMediaAbsolue } from "@/lib/api/client";
import { requireSectionAccess } from "@/lib/auth/guard";
import { formatRelative } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export const metadata = { title: "Signalements citoyens" };

/**
 * File des signalements de terrain déposés depuis l'application mobile :
 * un problème constaté (voirie, désinformation…), localisé, photographié.
 * Cycle : reçu → en cours → résolu (ou rejeté). Le citoyen suit l'évolution
 * du statut dans « Mes signalements ».
 */
export default async function SignalementsCitoyensPage() {
  await requireSectionAccess("/signalements");
  const signalements = await listSignalementsCitoyens();

  const recus = signalements.filter((s) => s.statut === "RECU");
  const enCours = signalements.filter((s) => s.statut === "EN_COURS");
  const clos = signalements.filter(
    (s) => s.statut === "RESOLU" || s.statut === "REJETE",
  );

  return (
    <>
      <PageHeader
        title="Signalements citoyens"
        description="Ce que les citoyens constatent sur le terrain — chaque évolution de statut est visible dans leur application."
      />

      <div className="space-y-8">
        <Section
          titre="À traiter"
          badge={recus.length}
          vide="Rien à traiter — la file est vide."
          items={recus}
        />
        <Section
          titre="En cours"
          badge={enCours.length}
          vide="Aucun signalement en cours de traitement."
          items={enCours}
        />
        {clos.length > 0 && (
          <Section titre="Clos" badge={clos.length} vide="" items={clos} estClos />
        )}
      </div>
    </>
  );
}

function Section({
  titre,
  badge,
  vide,
  items,
  estClos = false,
}: {
  titre: string;
  badge: number;
  vide: string;
  items: SignalementCitoyenAdmin[];
  estClos?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 font-heading text-[17px] font-bold text-ink">
        {titre} · {badge}
      </h2>

      {items.length === 0 ? (
        <Card>
          <p className="flex items-center justify-center gap-2 py-6 text-[14px] text-ink-muted">
            <Inbox className="size-4" aria-hidden />
            {vide}
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((signalement, index) => (
            <CarteSignalement
              key={signalement.id}
              signalement={signalement}
              index={index}
              estClos={estClos}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CarteSignalement({
  signalement,
  index,
  estClos,
}: {
  signalement: SignalementCitoyenAdmin;
  index: number;
  estClos: boolean;
}) {
  const positionUrl =
    signalement.latitude !== null && signalement.longitude !== null
      ? `https://www.openstreetmap.org/?mlat=${signalement.latitude}&mlon=${signalement.longitude}#map=18/${signalement.latitude}/${signalement.longitude}`
      : null;

  return (
    <Card
      flush
      className={cn("animate-rise overflow-hidden", estClos && "opacity-75")}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {signalement.urlPhoto && (
        <img
          src={urlMediaAbsolue(signalement.urlPhoto) ?? undefined}
          alt=""
          className="h-36 w-full object-cover"
        />
      )}

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
            <Megaphone className="size-3.5" aria-hidden />
            {LIBELLES_CATEGORIES[signalement.categorie]}
          </span>
          <div className="flex items-center gap-2">
            {signalement.statut === "RESOLU" && (
              <Badge tone="success" dot>
                Résolu
              </Badge>
            )}
            {signalement.statut === "REJETE" && <Badge tone="neutral">Rejeté</Badge>}
            {signalement.statut === "EN_COURS" && (
              <Badge tone="warning" dot>
                En cours
              </Badge>
            )}
            {signalement.statut === "RECU" && <Badge tone="info">Reçu</Badge>}
            <span className="text-[12px] text-ink-subtle">
              {formatRelative(signalement.creeLe)}
            </span>
          </div>
        </div>

        <p className="mt-2 text-[15px] font-semibold leading-snug text-ink">
          {signalement.description}
        </p>

        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-ink-muted">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {signalement.adresse}
          {positionUrl && (
            <a
              href={positionUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              Carte
              <ExternalLink className="size-3" aria-hidden />
            </a>
          )}
        </p>

        {!estClos && (
          <div className="mt-4 flex gap-2">
            {signalement.statut === "RECU" && (
              <form action={changerStatutSignalement} className="flex-1">
                <input type="hidden" name="id" value={signalement.id} />
                <input type="hidden" name="statut" value="EN_COURS" />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full"
                  icon={<Play className="size-3.5" />}
                >
                  Prendre en charge
                </Button>
              </form>
            )}
            {signalement.statut === "EN_COURS" && (
              <form action={changerStatutSignalement} className="flex-1">
                <input type="hidden" name="id" value={signalement.id} />
                <input type="hidden" name="statut" value="RESOLU" />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full"
                  icon={<CheckCircle2 className="size-3.5" />}
                >
                  Marquer résolu
                </Button>
              </form>
            )}
            <form action={changerStatutSignalement}>
              <input type="hidden" name="id" value={signalement.id} />
              <input type="hidden" name="statut" value="REJETE" />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                className="border-danger text-danger hover:bg-danger-pale"
                icon={<XCircle className="size-3.5" />}
              >
                Rejeter
              </Button>
            </form>
          </div>
        )}
      </div>
    </Card>
  );
}
