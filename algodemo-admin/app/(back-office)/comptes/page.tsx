import Link from "next/link";
import { UserPlus, ChevronRight, ShieldCheck, Lock } from "lucide-react";
import { listAccounts, TOTAL_ACCOUNTS } from "@/lib/data/accounts";
import { ROLES, ROLE_LABELS, type UserRole } from "@/lib/domain/roles";
import { formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Comptes" };

const FILTERS = ["tous", "standard", "points-focaux", "admins"] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_TO_ROLE: Record<Exclude<Filter, "tous">, UserRole> = {
  standard: ROLES.STANDARD,
  "points-focaux": ROLES.POINT_FOCAL,
  admins: ROLES.ADMIN_LABO,
};

const ROLE_TONES: Record<UserRole, BadgeTone> = {
  [ROLES.STANDARD]: "neutral",
  [ROLES.POINT_FOCAL]: "warning",
  [ROLES.ADMIN_LABO]: "brand",
};

const isFilter = (value: string | undefined): value is Filter =>
  FILTERS.includes(value as Filter);

export default async function ComptesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>;
}) {
  const { filtre } = await searchParams;
  const activeFilter: Filter = isFilter(filtre) ? filtre : "tous";

  const accounts = await listAccounts();
  const visible =
    activeFilter === "tous"
      ? accounts
      : accounts.filter((account) => account.role === FILTER_TO_ROLE[activeFilter]);

  return (
    <>
      <PageHeader
        title="Comptes"
        description={`${formatNumber(TOTAL_ACCOUNTS)} comptes enregistrés sur la plateforme.`}
        actions={
          <Button icon={<UserPlus className="size-4" />}>Ajouter</Button>
        }
      />

      <Tabs
        activeKey={activeFilter}
        hrefForTab={(key) => `/comptes?filtre=${key}`}
        className="mb-6"
        tabs={[
          { key: "tous", label: "Tous" },
          { key: "standard", label: "Standard" },
          { key: "points-focaux", label: "Points focaux" },
          { key: "admins", label: "Administrateurs" },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card flush className="lg:col-span-2">
          <ul className="divide-y divide-line-soft">
            {visible.map((account, index) => (
              <li
                key={account.id}
                className="animate-rise"
                style={{ animationDelay: `${index * 35}ms` }}
              >
                <Link
                  href={`/comptes/${account.id}`}
                  className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-raised"
                >
                  <Avatar
                    firstName={account.firstName}
                    lastName={account.lastName}
                    anonymised={account.isAnonymised}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[14px] font-bold text-ink group-hover:text-primary">
                      {account.firstName} {account.lastName}
                      {account.isAnonymised && (
                        <Lock className="size-3 text-ink-subtle" aria-hidden />
                      )}
                    </p>
                    <p className="truncate font-mono text-[13px] text-ink-subtle">
                      {account.email}
                    </p>
                  </div>

                  <Badge tone={ROLE_TONES[account.role]} className="hidden sm:inline-flex">
                    {ROLE_LABELS[account.role]}
                  </Badge>

                  <ChevronRight
                    className="size-4 shrink-0 text-ink-subtle group-hover:text-primary"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}

            {visible.length === 0 && (
              <li className="px-5 py-12 text-center text-[14px] text-ink-muted">
                Aucun compte ne correspond à ce filtre.
              </li>
            )}
          </ul>
        </Card>

        {/* ─── Rappel métier ───────────────────────────────────────── */}
        <Card className="h-fit bg-secondary-pale ring-1 ring-secondary/25">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-[18px] shrink-0 text-secondary" aria-hidden />
            <div>
              <p className="text-[15px] font-bold text-ink">Gestion des rôles</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">
                Les points focaux ont la capacité de modérer les débats et de
                valider l&apos;étape 2 de la triangulation. Vérifiez leur
                identité avant toute certification — cette action est tracée et
                engage le Laboratoire.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
