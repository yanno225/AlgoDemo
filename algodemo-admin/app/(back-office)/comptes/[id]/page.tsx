import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  CalendarDays,
  BadgeCheck,
  BadgeX,
  Lock,
} from "lucide-react";
import { getAccount } from "@/lib/data/accounts";
import { ROLES, ROLE_LABELS } from "@/lib/domain/roles";
import { formatDate } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { CountUp } from "@/components/ui/CountUp";

export default async function CompteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await getAccount(id);

  if (!account) notFound();

  const isCertified = account.role === ROLES.POINT_FOCAL;
  const isAdmin = account.role === ROLES.ADMIN_LABO;

  const stats = [
    { label: "Avis déposés", value: account.activity.contributions },
    { label: "Votes", value: account.activity.votes },
    { label: "Débats", value: account.activity.debates },
  ];

  return (
    <>
      <Link
        href="/comptes"
        className="mb-4 inline-flex items-center gap-2 text-[14px] font-medium text-ink-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour aux comptes
      </Link>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ─── Identité ────────────────────────────────────────────── */}
        <Card className="h-fit text-center">
          <div className="flex flex-col items-center">
            <Avatar
              firstName={account.firstName}
              lastName={account.lastName}
              size="lg"
              anonymised={account.isAnonymised}
            />

            <h1 className="mt-3 font-heading text-[20px] font-bold text-ink">
              {account.firstName} {account.lastName}
            </h1>

            <Badge
              tone={isAdmin ? "brand" : isCertified ? "warning" : "neutral"}
              className="mt-2"
            >
              {ROLE_LABELS[account.role]}
            </Badge>
          </div>

          {account.isAnonymised ? (
            <p className="mt-5 flex items-start gap-2 rounded-lg bg-surface-raised p-3 text-left text-[13px] leading-relaxed text-ink-muted">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Les données personnelles de ce compte sont chiffrées et ne sont
              pas lisibles par l&apos;administration (RG-USR-07).
            </p>
          ) : (
            <dl className="mt-5 space-y-3 text-left">
              <div className="flex items-center gap-3">
                <Mail className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                    Email
                  </dt>
                  <dd className="truncate font-mono text-[13px] text-ink">{account.email}</dd>
                </div>
              </div>

              {account.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                      Téléphone
                    </dt>
                    <dd className="text-[14px] text-ink">{account.phone}</dd>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <CalendarDays className="size-4 shrink-0 text-ink-subtle" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-subtle">
                    Inscrit le
                  </dt>
                  <dd className="text-[14px] text-ink">
                    {formatDate(account.createdAt)}
                  </dd>
                </div>
              </div>
            </dl>
          )}

          {/* TODO(backend) : POST /admin/accounts/:id/certify | /revoke */}
          {!isAdmin && (
            <Button
              variant="outline"
              className={
                isCertified
                  ? "mt-5 w-full border-danger text-danger hover:bg-danger-pale"
                  : "mt-5 w-full"
              }
              icon={
                isCertified ? (
                  <BadgeX className="size-4" />
                ) : (
                  <BadgeCheck className="size-4" />
                )
              }
            >
              {isCertified ? "Révoquer la certification" : "Certifier ce compte"}
            </Button>
          )}
        </Card>

        <div className="space-y-5 lg:col-span-2">
          {/* ─── Contributions ─────────────────────────────────────── */}
          <Card>
            <CardHeader
              title="Contributions"
              description="Activité citoyenne agrégée. Le détail nominatif des votes n'est jamais exposé (RG-CON-05)."
            />

            <dl className="mt-5 grid grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg bg-surface-raised p-4 text-center ring-1 ring-hairline"
                >
                  <dd className="tabular font-heading text-[36px] font-extrabold leading-none text-primary">
                    <CountUp value={stat.value} />
                  </dd>
                  <dt className="mt-2 text-[12px] font-medium text-ink-muted">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          </Card>

          {/* ─── Historique du rôle ────────────────────────────────── */}
          <Card>
            <CardHeader
              title="Historique du rôle"
              description="Chaque changement de rôle est horodaté et attribué à son auteur."
            />

            <ol className="mt-5 space-y-4">
              {account.roleHistory.map((event, index) => (
                <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < account.roleHistory.length - 1 && (
                    <span
                      className="absolute left-[5px] top-4 h-full w-px bg-line-soft"
                      aria-hidden
                    />
                  )}
                  <span
                    className={`mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ${
                      event.type === "certified"
                        ? "bg-success ring-success/15"
                        : event.type === "revoked"
                          ? "bg-danger ring-danger/15"
                          : "bg-ink-subtle ring-line-soft"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-ink">
                      {event.label}
                      {event.by && (
                        <span className="font-normal text-ink-muted"> par {event.by}</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-subtle">
                      {formatDate(event.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
