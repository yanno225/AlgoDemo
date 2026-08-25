/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ChartColumn,
  Play,
  Plus,
  Radio,
  Sparkles,
  Vote,
} from "lucide-react";
import {
  compterResumesEnAttente,
  estOuverte,
  listConsultationsAdmin,
  listDebats,
  type ConsultationAdmin,
  type DebatAdmin,
} from "@/lib/data/debats";
import { demarrerDebat, publierResultats } from "@/lib/data/debats-actions";
import { urlMediaAbsolue } from "@/lib/api/client";
import { getThematicByLabel } from "@/lib/domain/thematics";
import { formatDate, formatTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusDot } from "@/components/ui/StatusDot";
import { cn } from "@/lib/cn";

export const metadata = { title: "Débats & consultations" };

const ONGLETS = ["debats", "consultations"] as const;
type Onglet = (typeof ONGLETS)[number];

const estOnglet = (valeur: string | undefined): valeur is Onglet =>
  ONGLETS.includes(valeur as Onglet);

const couleurDe = (debat: DebatAdmin) => {
  const habillage = debat.thematique
    ? getThematicByLabel(debat.thematique.libelle)
    : undefined;
  return habillage ? `var(--color-${habillage.color})` : "var(--color-primary)";
};

export default async function DebatsPage({
  searchParams,
}: {
  // Next 16 : `searchParams` est asynchrone.
  searchParams: Promise<{ onglet?: string }>;
}) {
  const { onglet } = await searchParams;
  const ongletActif: Onglet = estOnglet(onglet) ? onglet : "debats";

  const [debats, consultations, resumesEnAttente] = await Promise.all([
    listDebats(),
    listConsultationsAdmin(),
    compterResumesEnAttente(),
  ]);

  const enDirect = debats.filter((debat) => debat.statut === "EN_COURS");
  const aVenir = debats
    .filter((debat) => debat.statut === "PLANIFIE")
    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut));
  const termines = debats
    .filter((debat) => debat.statut === "TERMINE")
    .sort((a, b) => b.dateDebut.localeCompare(a.dateDebut));

  const ouvertes = consultations.filter(estOuverte);
  const futures = consultations.filter(
    (consultation) =>
      new Date(consultation.dateOuverture).getTime() > Date.now(),
  );
  const cloturees = consultations.filter(
    (consultation) =>
      new Date(consultation.dateCloture).getTime() <= Date.now(),
  );

  return (
    <>
      <PageHeader
        title="Débats & consultations"
        description="Les lives encadrés et les votes citoyens — plusieurs directs peuvent être menés en parallèle."
        actions={
          <Button
            href={
              ongletActif === "debats"
                ? "/debats/nouveau"
                : "/debats/consultations/nouvelle"
            }
            icon={<Plus className="size-4" />}
          >
            {ongletActif === "debats" ? "Planifier un débat" : "Nouvelle consultation"}
          </Button>
        }
      />

      {resumesEnAttente > 0 && (
        <Link
          href="/moderation?onglet=resumes"
          className="group mb-6 flex items-center gap-3 rounded-xl bg-primary-pale p-4 ring-1 ring-primary/15 transition-all duration-200 hover:-translate-y-px hover:shadow-md"
        >
          <Sparkles className="size-[18px] shrink-0 text-primary" aria-hidden />
          <p className="flex-1 text-[14px] leading-relaxed text-ink-muted">
            <strong className="text-ink">
              {resumesEnAttente} résumé{resumesEnAttente > 1 ? "s" : ""} IA
            </strong>{" "}
            de débat{resumesEnAttente > 1 ? "s" : ""} attend
            {resumesEnAttente > 1 ? "ent" : ""} votre validation.
          </p>
          <ArrowRight
            className="size-4 shrink-0 text-primary transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}

      <Tabs
        activeKey={ongletActif}
        hrefForTab={(key) => `/debats?onglet=${key}`}
        className="mb-6"
        tabs={[
          { key: "debats", label: "Débats", count: debats.length },
          {
            key: "consultations",
            label: "Consultations",
            count: consultations.length,
          },
        ]}
      />

      {ongletActif === "debats" && (
        <div className="space-y-8">
          {/* ─── En direct ───────────────────────────────────────────
              Plusieurs lives simultanés sont un cas nominal : chacun a sa
              carte, sa couverture, son bouton de clôture. */}
          {enDirect.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 font-heading text-[17px] font-bold text-ink">
                <StatusDot pulse />
                En direct · {enDirect.length}
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                {enDirect.map((debat, index) => (
                  <Card
                    key={debat.id}
                    flush
                    className="animate-rise overflow-hidden"
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    {/* La couverture est l'identité visuelle du live. */}
                    <div className="relative h-36 w-full">
                      {debat.urlCouverture ? (
                        <img
                          src={urlMediaAbsolue(debat.urlCouverture) ?? undefined}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          className="h-full w-full"
                          style={{ backgroundColor: couleurDe(debat) }}
                        />
                      )}
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                        <Radio className="size-3" aria-hidden />
                        Direct
                      </span>
                    </div>

                    <div className="p-5">
                      <p
                        className="text-[11px] font-bold uppercase tracking-[0.08em]"
                        style={{ color: couleurDe(debat) }}
                      >
                        {debat.thematique?.libelle}
                      </p>
                      <h3 className="mt-1 text-[15px] font-bold leading-snug text-ink">
                        {debat.titre}
                      </h3>
                      <p className="mt-1 text-[12px] text-ink-subtle">
                        Démarré · prévu {formatDate(debat.dateDebut)} à{" "}
                        {formatTime(debat.dateDebut)}
                      </p>

                      {/* La clôture vit dans la console, avec le fil, les
                          affirmations et les signalements. */}
                      <div className="mt-4">
                        <Button
                          href={`/debats/${debat.id}/direct`}
                          size="sm"
                          className="w-full"
                          icon={<Radio className="size-3.5" />}
                        >
                          Gérer le direct
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* ─── À venir ─────────────────────────────────────────────── */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-heading text-[17px] font-bold text-ink">
              <CalendarClock className="size-4 text-ink-subtle" aria-hidden />
              À venir · {aVenir.length}
            </h2>
            {aVenir.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {aVenir.map((debat, index) => (
                  <Card
                    key={debat.id}
                    className="animate-rise"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="size-2.5 shrink-0 translate-y-1.5 rounded-full"
                        style={{ backgroundColor: couleurDe(debat) }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[14px] font-bold leading-snug text-ink">
                          {debat.titre}
                        </h3>
                        <p className="mt-1 text-[12px] text-ink-subtle">
                          {formatDate(debat.dateDebut)} ·{" "}
                          {formatTime(debat.dateDebut)}
                        </p>
                      </div>
                    </div>

                    <form action={demarrerDebat} className="mt-4">
                      <input type="hidden" name="id" value={debat.id} />
                      <Button
                        type="submit"
                        size="sm"
                        className="w-full"
                        icon={<Play className="size-3.5" />}
                      >
                        Démarrer le direct
                      </Button>
                    </form>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <p className="py-6 text-center text-[14px] text-ink-muted">
                  Aucun débat planifié — utilisez « Planifier un débat » pour en
                  créer un.
                </p>
              </Card>
            )}
          </section>

          {/* ─── Terminés ────────────────────────────────────────────── */}
          {termines.length > 0 && (
            <section>
              <h2 className="mb-4 font-heading text-[17px] font-bold text-ink">
                Terminés · {termines.length}
              </h2>
              <Card flush className="overflow-hidden">
                <ul className="divide-y divide-line-soft">
                  {termines.map((debat) => (
                    <li
                      key={debat.id}
                      className="flex items-center gap-3 px-5 py-4"
                    >
                      <span
                        className="h-8 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: couleurDe(debat) }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-ink">
                          {debat.titre}
                        </p>
                        <p className="text-[12px] text-ink-subtle">
                          {formatDate(debat.dateDebut)}
                        </p>
                      </div>
                      <Badge tone={debat.urlReplay ? "success" : "neutral"}>
                        {debat.urlReplay ? "Replay disponible" : "Sans replay"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}
        </div>
      )}

      {ongletActif === "consultations" && (
        <div className="space-y-8">
          {/* ─── Ouvertes ────────────────────────────────────────────── */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-heading text-[17px] font-bold text-ink">
              <Vote className="size-4 text-primary" aria-hidden />
              Ouvertes au vote · {ouvertes.length}
            </h2>
            {ouvertes.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {ouvertes.map((consultation, index) => (
                  <CarteConsultation
                    key={consultation.id}
                    consultation={consultation}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <p className="py-6 text-center text-[14px] text-ink-muted">
                  Aucune consultation ouverte actuellement.
                </p>
              </Card>
            )}
          </section>

          {futures.length > 0 && (
            <section>
              <h2 className="mb-4 font-heading text-[17px] font-bold text-ink">
                À venir · {futures.length}
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                {futures.map((consultation, index) => (
                  <CarteConsultation
                    key={consultation.id}
                    consultation={consultation}
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}

          {cloturees.length > 0 && (
            <section>
              <h2 className="mb-4 font-heading text-[17px] font-bold text-ink">
                Clôturées · {cloturees.length}
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                {cloturees.map((consultation, index) => (
                  <CarteConsultation
                    key={consultation.id}
                    consultation={consultation}
                    index={index}
                    cloturee
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}

// ─── Carte consultation ──────────────────────────────────────────────
function CarteConsultation({
  consultation,
  index,
  cloturee = false,
}: {
  consultation: ConsultationAdmin;
  index: number;
  cloturee?: boolean;
}) {
  return (
    <Card
      className={cn("animate-rise", cloturee && "bg-surface-raised")}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <CardHeader
        title={consultation.titre}
        description={`${formatDate(consultation.dateOuverture)} → ${formatDate(consultation.dateCloture)}`}
        action={
          <div className="flex items-center gap-2">
            {consultation.type === "SONDAGE" && (
              <Badge tone="brand">Sondage</Badge>
            )}
            {consultation.resultatsPublies ? (
              <Badge tone="success" dot>
                Résultats publiés
              </Badge>
            ) : cloturee ? (
              <Badge tone="warning" dot>
                À dépouiller
              </Badge>
            ) : null}
          </div>
        }
      />

      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">
        {consultation.resumeVulgarise}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {consultation.options.map((option) => (
          <span
            key={option.id}
            className="rounded-full bg-surface-raised px-2.5 py-1 text-[12px] font-medium text-ink-muted ring-1 ring-hairline"
          >
            {option.libelle}
          </span>
        ))}
      </div>

      {/* Le dépouillement reste secret jusqu'à publication par un admin. */}
      {cloturee && !consultation.resultatsPublies && (
        <form action={publierResultats} className="mt-4">
          <input type="hidden" name="id" value={consultation.id} />
          <Button
            type="submit"
            size="sm"
            className="w-full"
            icon={<ChartColumn className="size-3.5" />}
          >
            Publier les résultats
          </Button>
        </form>
      )}
    </Card>
  );
}
