import Link from "next/link";
import { ChevronRight, Lock, ShieldCheck } from "lucide-react";
import { compterParEtat, listComptes } from "@/lib/data/comptes";
import { ROLES, ROLE_LABELS, type UserRole } from "@/lib/domain/roles";
import { formatShortDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { CompteDetail } from "@/lib/domain/types";

export const metadata = { title: "Comptes" };

const FILTRES = [
  "tous",
  "a-valider",
  "bloques",
  "points-focaux",
  "admins",
] as const;
type Filtre = (typeof FILTRES)[number];

const ROLE_TONES: Record<UserRole, BadgeTone> = {
  [ROLES.STANDARD]: "neutral",
  [ROLES.POINT_FOCAL]: "warning",
  [ROLES.ADMIN_LABO]: "brand",
};

const estFiltre = (valeur: string | undefined): valeur is Filtre =>
  FILTRES.includes(valeur as Filtre);

const appliquerFiltre = (comptes: CompteDetail[], filtre: Filtre) => {
  switch (filtre) {
    case "a-valider":
      return comptes.filter((c) => !c.compteValide && !c.estBloque);
    case "bloques":
      return comptes.filter((c) => c.estBloque);
    case "points-focaux":
      return comptes.filter((c) => c.role === ROLES.POINT_FOCAL);
    case "admins":
      return comptes.filter((c) => c.role === ROLES.ADMIN_LABO);
    default:
      return comptes;
  }
};

export default async function ComptesPage({
  searchParams,
}: {
  // Next 16 : `searchParams` est asynchrone.
  searchParams: Promise<{ filtre?: string }>;
}) {
  const { filtre } = await searchParams;
  const filtreActif: Filtre = estFiltre(filtre) ? filtre : "tous";

  const comptes = await listComptes();
  const compteurs = compterParEtat(comptes);
  const visibles = appliquerFiltre(comptes, filtreActif);

  return (
    <>
      <PageHeader
        title="Comptes"
        description={`${comptes.length} compte${comptes.length > 1 ? "s" : ""} enregistré${comptes.length > 1 ? "s" : ""} sur la plateforme.`}
      />

      <Tabs
        activeKey={filtreActif}
        hrefForTab={(key) => `/comptes?filtre=${key}`}
        className="mb-6"
        tabs={[
          { key: "tous", label: "Tous", count: compteurs.tous },
          { key: "a-valider", label: "À valider", count: compteurs.aValider },
          { key: "bloques", label: "Bloqués", count: compteurs.bloques },
          { key: "points-focaux", label: "Points focaux" },
          { key: "admins", label: "Administrateurs" },
        ]}
      />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <Card flush className="overflow-hidden lg:col-span-2">
          <ul className="divide-y divide-line-soft">
            {visibles.map((compte, index) => (
              <li
                key={compte.id}
                className="animate-rise"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <Link
                  href={`/comptes/${compte.id}`}
                  className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-raised"
                >
                  <Avatar
                    firstName={compte.prenom}
                    lastName={compte.nom}
                    anonymised={compte.anonymise}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[14px] font-bold text-ink group-hover:text-primary">
                      {compte.prenom} {compte.nom}
                      {compte.anonymise && (
                        <Lock className="size-3 text-ink-subtle" aria-hidden />
                      )}
                    </p>
                    <p className="truncate font-mono text-[13px] text-ink-subtle">
                      {compte.email}
                    </p>
                  </div>

                  {/* L'état prime sur le rôle : un compte bloqué ou en attente
                      doit se repérer sans ouvrir la fiche. */}
                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    {compte.estBloque && <Badge tone="danger" dot>Bloqué</Badge>}
                    {!compte.estBloque && !compte.compteValide && (
                      <Badge tone="warning" dot>À valider</Badge>
                    )}
                    <Badge tone={ROLE_TONES[compte.role]}>
                      {ROLE_LABELS[compte.role]}
                    </Badge>
                  </div>

                  <span className="hidden shrink-0 text-[12px] text-ink-subtle xl:block">
                    {formatShortDate(compte.creeLe)}
                  </span>

                  <ChevronRight
                    className="size-4 shrink-0 text-ink-subtle group-hover:text-primary"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}

            {visibles.length === 0 && (
              <li className="px-5 py-12 text-center text-[14px] text-ink-muted">
                Aucun compte ne correspond à ce filtre.
              </li>
            )}
          </ul>
        </Card>

        {/* ─── Rappel métier ───────────────────────────────────────── */}
        <Card className="bg-secondary-pale ring-1 ring-secondary/25 lg:sticky lg:top-6">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 size-[18px] shrink-0 text-secondary"
              aria-hidden
            />
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
