import Link from "next/link";
import {
  ShieldCheck,
  FileSearch,
  BadgeCheck,
  Sparkles,
  ArrowUpRight,
  Users,
  Radio,
  TrendingUp,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getDashboardAlerts, getRecentActivity } from "@/lib/data/dashboard";
import { listDebates, listConsultations, listAiSummaries } from "@/lib/data/debates";
import { getThematic } from "@/lib/domain/thematics";
import { formatDeadline, formatNumber, formatRelative } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Sparkline } from "@/components/ui/Sparkline";
import { CountUp } from "@/components/ui/CountUp";

export const metadata = { title: "Tableau de bord" };

const ALERT_META = {
  moderation: { icon: ShieldCheck, color: "var(--color-secondary)" },
  verification: { icon: FileSearch, color: "var(--color-info)" },
  certification: { icon: BadgeCheck, color: "var(--color-primary-light)" },
} as const;

// TODO(backend) : série de participation des 14 derniers jours.
const PARTICIPATION_TREND = [
  180, 210, 195, 260, 240, 320, 290, 380, 420, 390, 480, 520, 610, 680,
];

export default async function DashboardPage() {
  const [user, alerts, activity, debates, consultations, summaries] =
    await Promise.all([
      getSession(),
      getDashboardAlerts(),
      getRecentActivity(),
      listDebates(),
      listConsultations(),
      listAiSummaries(),
    ]);

  const liveDebate = debates.find((debate) => debate.status === "live");
  const openConsultations = consultations.filter((item) => item.status === "open");
  const totalEngaged = openConsultations.reduce(
    (sum, item) => sum + item.participants,
    0
  );

  return (
    <>
      <PageHeader
        title={`Bonjour ${user?.firstName ?? ""}`}
        description="Vue d'ensemble de la modération, de la vérification et de la participation citoyenne."
        actions={
          <Button href="/debats" icon={<Sparkles className="size-4" />}>
            Créer
          </Button>
        }
      />

      {/* ─── Files d'attente ─────────────────────────────────────────
          Ces trois compteurs sont la raison d'être de l'écran : ils disent
          d'un regard ce qui bloque, et mènent droit au travail. */}
      <div className="mb-5 grid gap-5 md:grid-cols-3">
        {alerts.map((alert, index) => {
          const meta = ALERT_META[alert.key];
          const Icon = meta.icon;

          return (
            <Link
              key={alert.key}
              href={alert.href}
              className="group animate-rise relative overflow-hidden rounded-xl bg-surface p-6 shadow-sm ring-1 ring-hairline transition-all duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:shadow-md"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Liseré coloré : identifie la file sans recourir à un aplat
                  qui écraserait le chiffre. */}
              <span
                className="absolute inset-y-0 left-0 w-1"
                style={{ backgroundColor: meta.color }}
                aria-hidden
              />

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: meta.color }}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {alert.label}
                  </span>

                  <p className="tabular mt-3 font-heading text-[48px] font-extrabold leading-none text-ink">
                    <CountUp value={alert.count} />
                  </p>

                  <p className="mt-2 text-[13px] leading-snug text-ink-muted">
                    {alert.detail}
                  </p>
                </div>

                <ArrowUpRight
                  className="size-4 shrink-0 -translate-x-1 text-ink-subtle opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                  aria-hidden
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* ─── Tendance de participation ───────────────────────────── */}
      <Card className="mb-5 animate-rise" style={{ animationDelay: "180ms" }}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-subtle">
              Participation citoyenne
            </p>
            <p className="tabular mt-2 font-heading text-[44px] font-extrabold leading-none text-primary">
              <CountUp value={totalEngaged} />
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-success">
              <TrendingUp className="size-3.5" aria-hidden />
              Sur les consultations ouvertes
            </p>
          </div>

          <Sparkline
            data={PARTICIPATION_TREND}
            label="Évolution de la participation sur 14 jours"
            width={260}
            height={60}
          />
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {/* ─── Débats & consultations ──────────────────────────── */}
          <Card>
            <CardHeader
              title="Débats & consultations"
              description="Ce qui se joue en ce moment sur la plateforme."
              action={
                <Button href="/debats" variant="ghost" size="sm">
                  Tout voir
                </Button>
              }
            />

            <div className="mt-5 space-y-3">
              {liveDebate && (
                <article className="relative overflow-hidden rounded-lg bg-rail p-4">
                  <div className="flex items-center gap-2 text-danger">
                    <StatusDot pulse />
                    <span className="text-[12px] font-bold uppercase tracking-wide text-white/90">
                      En direct
                    </span>
                    <span className="tabular ml-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-white/70">
                      <Users className="size-3.5" aria-hidden />
                      {formatNumber(liveDebate.participants ?? 0)}
                    </span>
                  </div>

                  <h3 className="mt-2 text-[15px] font-bold text-white">
                    {liveDebate.title}
                  </h3>
                  <p className="mt-1 text-[13px] text-white/55">
                    Modéré par {liveDebate.moderator.firstName}{" "}
                    {liveDebate.moderator.lastName}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      href="/debats"
                      size="sm"
                      variant="secondary"
                      icon={<Radio className="size-3.5" />}
                    >
                      Rejoindre
                    </Button>
                    <Button
                      href="/debats"
                      size="sm"
                      className="border-[1.5px] border-white/25 bg-transparent text-white hover:bg-white/10"
                    >
                      Clôturer
                    </Button>
                  </div>
                </article>
              )}

              {openConsultations.map((consultation, index) => {
                const thematic = getThematic(consultation.thematicIds[0]);
                const accent = thematic
                  ? `var(--color-${thematic.color})`
                  : "var(--color-primary)";

                return (
                  <article
                    key={consultation.id}
                    className="relative overflow-hidden rounded-lg bg-surface-raised p-4 ring-1 ring-hairline"
                  >
                    <span
                      className="absolute inset-y-0 left-0 w-[3px]"
                      style={{ backgroundColor: accent }}
                      aria-hidden
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {thematic && (
                          <span
                            className="text-[11px] font-bold uppercase tracking-[0.08em]"
                            style={{ color: accent }}
                          >
                            {thematic.label}
                          </span>
                        )}
                        <h3 className="mt-1 text-[15px] font-semibold leading-snug text-ink">
                          {consultation.title}
                        </h3>
                      </div>

                      <span className="tabular shrink-0 rounded-md bg-primary-pale px-2 py-1 text-[12px] font-bold text-primary">
                        {formatDeadline(consultation.closesAt)}
                      </span>
                    </div>

                    <ProgressBar
                      value={consultation.participationRate}
                      label={`${formatNumber(consultation.participants)} participants engagés`}
                      color={accent}
                      delay={200 + index * 120}
                      className="mt-3"
                    />
                  </article>
                );
              })}
            </div>
          </Card>

          {/* ─── Résumés IA ──────────────────────────────────────── */}
          <Card>
            <CardHeader
              title="Résumés IA à valider"
              description="Aucune synthèse n'est diffusée sans validation humaine préalable."
            />

            <ul className="mt-5 space-y-2">
              {summaries.map((summary) => (
                <li
                  key={summary.id}
                  className="group flex flex-wrap items-center gap-3 rounded-lg p-3 transition-colors duration-150 hover:bg-secondary-pale"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary/15">
                    <Sparkles className="size-[18px] text-secondary" aria-hidden />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-ink">
                      {summary.title}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[13px] text-ink-subtle">
                      {summary.excerpt}
                    </p>
                  </div>

                  <span className="hidden shrink-0 text-[12px] text-ink-subtle sm:block">
                    {formatRelative(summary.generatedAt)}
                  </span>

                  <Button size="sm" variant="secondary">
                    Valider
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* ─── Activité récente ────────────────────────────────────── */}
        <Card className="h-fit">
          <CardHeader title="Activité récente" />

          <ol className="mt-5">
            {activity.map((event, index) => (
              <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                {/* Filet vertical reliant les événements — lecture en fil du temps. */}
                {index < activity.length - 1 && (
                  <span
                    className="absolute left-[5px] top-4 h-full w-px bg-line-soft"
                    aria-hidden
                  />
                )}
                <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary-pale" />

                <div className="min-w-0">
                  <p className="text-[14px] leading-snug text-ink">
                    <span className="font-semibold">{event.label}</span>{" "}
                    <span className="text-ink-muted">{event.detail}</span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-subtle">
                    {formatRelative(event.at)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
