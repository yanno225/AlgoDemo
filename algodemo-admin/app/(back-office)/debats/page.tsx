import Link from "next/link";
import { Plus, Sparkles, Users, CalendarDays, ArrowUpRight } from "lucide-react";
import { listDebates, listConsultations, listAiSummaries } from "@/lib/data/debates";
import { getThematic } from "@/lib/domain/thematics";
import {
  formatDeadline,
  formatNumber,
  formatRelative,
  formatShortDate,
  formatTime,
} from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";
import { ProgressBar } from "@/components/ui/ProgressBar";

export const metadata = { title: "Débats & consultations" };

const TAB_KEYS = ["debats", "consultations"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const isTabKey = (value: string | undefined): value is TabKey =>
  TAB_KEYS.includes(value as TabKey);

export default async function DebatsPage({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string }>;
}) {
  const { onglet } = await searchParams;
  const activeTab: TabKey = isTabKey(onglet) ? onglet : "debats";

  const [debates, consultations, summaries] = await Promise.all([
    listDebates(),
    listConsultations(),
    listAiSummaries(),
  ]);

  const live = debates.filter((item) => item.status === "live");
  const scheduled = debates.filter((item) => item.status === "scheduled");
  const closed = debates.filter((item) => item.status === "closed");

  const open = consultations.filter((item) => item.status === "open");
  const upcoming = consultations.filter((item) => item.status === "scheduled");
  const finished = consultations.filter((item) => item.status === "closed");

  // La création de consultation vit sous `/debats` afin d'hériter de sa
  // permission (RG-CON-01 : Laboratoire uniquement). Une route racine
  // `/consultations` retomberait sur la garde générique, plus permissive.
  const createHref =
    activeTab === "debats" ? "/debats/nouveau" : "/debats/consultations/nouvelle";

  return (
    <>
      <PageHeader
        title="Débats & consultations"
        description="Programmez les débats encadrés et pilotez les consultations citoyennes."
        actions={
          <Button href={createHref} icon={<Plus className="size-4" />}>
            Créer
          </Button>
        }
      />

      <Tabs
        activeKey={activeTab}
        hrefForTab={(key) => `/debats?onglet=${key}`}
        className="mb-6"
        tabs={[
          { key: "debats", label: "Débats", count: debates.length },
          { key: "consultations", label: "Consultations", count: consultations.length },
        ]}
      />

      {/* ─── Rappel des synthèses en attente ─────────────────────────
          Placé en tête : une synthèse non validée bloque la restitution
          publique du débat auquel elle se rattache. */}
      <Link
        href="/"
        className="group mb-6 flex items-center gap-3 rounded-xl bg-secondary-pale p-4 shadow-sm ring-1 ring-secondary/25 transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary/15">
          <Sparkles className="size-5 text-secondary" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-ink">
            {summaries.length} résumés IA à valider
          </span>
          <span className="block text-[13px] text-ink-muted">
            Synthèses générées pour les débats et consultations clos.
          </span>
        </span>
        <ArrowUpRight
          className="size-4 shrink-0 text-secondary opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </Link>

      {activeTab === "debats" ? (
        <div className="space-y-6">
          {live.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] text-danger">
                <StatusDot pulse />
                En direct
              </h2>

              <div className="grid gap-4 xl:grid-cols-2">
                {live.map((debate) => (
                  <Card key={debate.id}>
                    <h3 className="text-[15px] font-bold text-ink">{debate.title}</h3>
                    <p className="mt-1 text-[13px] text-ink-muted">
                      Modérateur : {debate.moderator.firstName} {debate.moderator.lastName}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted">
                      <Users className="size-3.5" aria-hidden />
                      {formatNumber(debate.participants ?? 0)} participants
                    </p>

                    <div className="mt-4 flex gap-2">
                      <Button size="sm" className="flex-1">
                        Rejoindre
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Clôturer
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-ink-subtle">
              À venir
            </h2>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {scheduled.map((debate) => {
                const thematic = getThematic(debate.thematicId);
                return (
                  <Card key={debate.id}>
                    {thematic && <Badge tone="brand">{thematic.label}</Badge>}

                    <h3 className="mt-2.5 text-[15px] font-bold leading-snug text-ink">
                      {debate.title}
                    </h3>

                    <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-ink-muted">
                      <CalendarDays className="size-3.5" aria-hidden />
                      {formatShortDate(debate.startsAt)} · {formatTime(debate.startsAt)}
                      {debate.endsAt && ` — ${formatTime(debate.endsAt)}`}
                    </p>
                  </Card>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-ink-subtle">
              Terminés
            </h2>

            <Card flush>
              <ul className="divide-y divide-line-soft">
                {closed.map((debate) => (
                  <li
                    key={debate.id}
                    className="flex flex-wrap items-center gap-3 px-5 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-ink">
                        {debate.title}
                      </p>
                      <p className="text-[12px] text-ink-subtle">
                        {formatRelative(debate.startsAt)} ·{" "}
                        {formatNumber(debate.participants ?? 0)} participants
                      </p>
                    </div>

                    <Badge
                      tone={debate.summaryStatus === "published" ? "success" : "warning"}
                      dot
                    >
                      {debate.summaryStatus === "published"
                        ? "Publié"
                        : "Synthèse en attente"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-primary">
              Ouvertes · {open.length} actives
            </h2>

            <div className="grid gap-4 xl:grid-cols-2">
              {open.map((consultation, index) => {
                const thematic = getThematic(consultation.thematicIds[0]);
                const accent = thematic
                  ? `var(--color-${thematic.color})`
                  : "var(--color-primary)";

                return (
                  <Card key={consultation.id} className="relative overflow-hidden">
                    {/* Liseré de thématique : lecture immédiate du domaine. */}
                    <span
                      className="absolute inset-y-0 left-0 w-1"
                      style={{ backgroundColor: accent }}
                      aria-hidden
                    />

                    <div className="flex items-start justify-between gap-3">
                      {thematic && (
                        <span
                          className="text-[11px] font-bold uppercase tracking-[0.08em]"
                          style={{ color: accent }}
                        >
                          {thematic.label}
                        </span>
                      )}
                      <span className="tabular shrink-0 rounded-md bg-primary-pale px-2 py-1 text-[12px] font-bold text-primary">
                        {formatDeadline(consultation.closesAt)}
                      </span>
                    </div>

                    <h3 className="mt-2 text-[15px] font-bold leading-snug text-ink">
                      {consultation.title}
                    </h3>

                    <ProgressBar
                      value={consultation.participationRate}
                      label={`${formatNumber(consultation.participants)} participants engagés`}
                      color={accent}
                      delay={index * 120}
                      className="mt-3"
                    />
                  </Card>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-ink-subtle">
              À venir
            </h2>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {upcoming.map((consultation) => {
                const thematic = getThematic(consultation.thematicIds[0]);
                return (
                  <Card key={consultation.id}>
                    {thematic && <Badge tone="neutral">{thematic.label}</Badge>}
                    <h3 className="mt-2.5 text-[15px] font-bold leading-snug text-ink">
                      {consultation.title}
                    </h3>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-ink-muted">
                      <CalendarDays className="size-3.5" aria-hidden />
                      Du {formatShortDate(consultation.opensAt)} au{" "}
                      {formatShortDate(consultation.closesAt)}
                    </p>
                  </Card>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-ink-subtle">
              Clôturées
            </h2>

            <Card flush>
              <ul className="divide-y divide-line-soft">
                {finished.map((consultation) => (
                  <li
                    key={consultation.id}
                    className="flex flex-wrap items-center gap-4 px-5 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-ink">
                        {consultation.title}
                      </p>
                      <p className="text-[12px] text-ink-subtle">
                        {formatNumber(consultation.participants)} participants
                      </p>
                    </div>

                    <div className="flex w-36 shrink-0 items-center gap-2.5">
                      <ProgressBar
                        value={consultation.participationRate}
                        size="sm"
                        className="flex-1"
                      />
                      <span className="tabular shrink-0 text-[13px] font-bold text-primary">
                        {consultation.participationRate}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        </div>
      )}
    </>
  );
}
