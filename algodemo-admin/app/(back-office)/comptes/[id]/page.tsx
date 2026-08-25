import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BadgeX,
  CalendarDays,
  CircleAlert,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { getCompte, getHistorique, getStatistiques } from "@/lib/data/comptes";
import {
  bloquerCompte,
  changerRole,
  validerCompte,
} from "@/lib/data/comptes-actions";
import { getSession } from "@/lib/auth/session";
import { ROLES, ROLE_LABELS, type UserRole } from "@/lib/domain/roles";
import { formatDate } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

export default async function CompteDetailPage({
  params,
}: {
  // Next 16 : `params` est asynchrone.
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [compte, moi, stats, historique] = await Promise.all([
    getCompte(id),
    getSession(),
    getStatistiques(id),
    getHistorique(id),
  ]);

  if (!compte) notFound();

  // Compteurs réellement calculés en base : chaque avis, vote et participation
  // porte l'identifiant de son auteur.
  const activite = [
    { libelle: "Avis déposés", valeur: stats.avisDeposes },
    { libelle: "dont approuvés", valeur: stats.avisApprouves, secondaire: true },
    { libelle: "Votes en consultation", valeur: stats.votesConsultations },
    { libelle: "Débats rejoints", valeur: stats.debatsRejoints },
    { libelle: "Votes en débat", valeur: stats.votesDebats },
    { libelle: "Prises de parole", valeur: stats.prisesDeParole },
    { libelle: "Signalements émis", valeur: stats.signalementsEmis },
  ];

  // Un administrateur ne peut ni se bloquer, ni se retirer ses propres droits :
  // il se couperait l'accès sans recours.
  const estMonCompte = compte.id === moi?.id;

  const etats = [
    {
      libelle: "Email vérifié",
      actif: compte.emailVerifie,
      detail: "L'adresse a été confirmée par un code.",
    },
    {
      libelle: "Compte validé",
      actif: compte.compteValide,
      detail: "Validation administrative requise pour participer.",
    },
    {
      libelle: "Double facteur",
      actif: compte.deuxFaActif,
      detail: "Obligatoire pour voter aux consultations.",
    },
    {
      libelle: "Protocole accepté",
      actif: Boolean(compte.politiqueConfidentialiteAccepteeLe),
      detail: compte.politiqueConfidentialiteAccepteeLe
        ? formatDate(compte.politiqueConfidentialiteAccepteeLe)
        : "Politique de confidentialité pas encore acceptée.",
    },
  ];

  return (
    <>
      <Link
        href="/comptes"
        className="mb-5 inline-flex items-center gap-2 text-[13px] font-medium text-ink-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Retour aux comptes
      </Link>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* ─── Identité et état ────────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-start gap-4">
              <Avatar
                firstName={compte.prenom}
                lastName={compte.nom}
                size="lg"
                anonymised={compte.anonymise}
              />

              <div className="min-w-0 flex-1">
                <h1 className="flex items-center gap-2 font-heading text-[24px] font-bold leading-tight text-ink">
                  {compte.prenom} {compte.nom}
                  {compte.anonymise && (
                    <Lock className="size-4 text-ink-subtle" aria-hidden />
                  )}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      compte.role === ROLES.ADMIN_LABO
                        ? "brand"
                        : compte.role === ROLES.POINT_FOCAL
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {ROLE_LABELS[compte.role]}
                  </Badge>
                  {compte.estBloque && <Badge tone="danger" dot>Bloqué</Badge>}
                  {!compte.estBloque && !compte.compteValide && (
                    <Badge tone="warning" dot>En attente de validation</Badge>
                  )}
                  {!compte.estBloque && compte.compteValide && (
                    <Badge tone="success" dot>Actif</Badge>
                  )}
                </div>

                <dl className="mt-4 space-y-1.5 text-[13px]">
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 shrink-0 text-ink-subtle" aria-hidden />
                    <dd className="min-w-0 break-all font-mono text-ink-muted">
                      {compte.email}
                    </dd>
                  </div>
                  {compte.telephone && (
                    <div className="flex items-center gap-2">
                      <Phone className="size-3.5 shrink-0 text-ink-subtle" aria-hidden />
                      <dd className="font-mono text-ink-muted">{compte.telephone}</dd>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-3.5 shrink-0 text-ink-subtle" aria-hidden />
                    <dd className="text-ink-muted">
                      Inscrit le {formatDate(compte.creeLe)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {compte.anonymise && (
              <p className="mt-5 flex items-start gap-2 rounded-lg bg-surface-raised p-3 text-[13px] leading-relaxed text-ink-muted">
                <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Ce compte a été anonymisé à la demande de son titulaire
                (RG-USR-07). Les données personnelles ne sont plus lisibles par
                l&apos;administration.
              </p>
            )}
          </Card>

          {/* Activité réellement enregistrée : chaque avis, vote et
              participation porte l'identifiant de son auteur en base. */}
          <Card>
            <CardHeader
              title="Activité citoyenne"
              description="Compteurs calculés à partir des actions réellement enregistrées."
            />
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {activite.map((item) => (
                <div
                  key={item.libelle}
                  className={cn(
                    "rounded-lg p-3",
                    item.secondaire ? "bg-primary-pale" : "bg-surface-raised",
                  )}
                >
                  <dd
                    className={cn(
                      "font-heading text-[24px] font-bold tabular",
                      item.valeur > 0 ? "text-primary" : "text-ink-subtle",
                    )}
                  >
                    {item.valeur}
                  </dd>
                  <dt className="mt-0.5 text-[12px] leading-snug text-ink-muted">
                    {item.libelle}
                  </dt>
                </div>
              ))}
            </dl>
          </Card>

          {/* Traçabilité des décisions : c'est ce qui rend une certification
              opposable — qui l'a accordée, quand, et depuis quel rôle. */}
          <Card>
            <CardHeader
              title="Décisions administratives"
              description="Journal en ajout seul : aucune ligne n'est modifiable."
            />
            {historique.length > 0 ? (
              <ol className="mt-4 space-y-2">
                {historique.map((decision) => (
                  <li
                    key={decision.id}
                    className="flex items-start gap-3 rounded-lg bg-surface-raised p-3"
                  >
                    <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-primary-pale">
                      {decision.type === "ROLE" ? (
                        <KeyRound className="size-3 text-primary" aria-hidden />
                      ) : decision.type === "BLOCAGE" ? (
                        <ShieldOff className="size-3 text-primary" aria-hidden />
                      ) : (
                        <ShieldCheck className="size-3 text-primary" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-ink">
                        {decision.type === "ROLE"
                          ? `Rôle : ${decision.ancienRole ? ROLE_LABELS[decision.ancienRole] : "—"} → ${decision.nouveauRole ? ROLE_LABELS[decision.nouveauRole] : "—"}`
                          : decision.type === "VALIDATION"
                            ? decision.actif
                              ? "Compte validé"
                              : "Validation retirée"
                            : decision.actif
                              ? "Accès bloqué"
                              : "Accès rétabli"}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-subtle">
                        {formatDate(decision.decideLe)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 rounded-lg bg-surface-raised p-4 text-[14px] leading-relaxed text-ink-muted">
                Aucune décision administrative n&apos;a encore été prise sur ce
                compte.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader
              title="État du compte"
              description="Conditions nécessaires à une participation complète."
            />
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {etats.map((etat) => (
                <li
                  key={etat.libelle}
                  className="flex items-start gap-2.5 rounded-lg bg-surface-raised p-3"
                >
                  {etat.actif ? (
                    <BadgeCheck
                      className="mt-0.5 size-4 shrink-0 text-success"
                      aria-hidden
                    />
                  ) : (
                    <BadgeX
                      className="mt-0.5 size-4 shrink-0 text-ink-subtle"
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-[14px] font-semibold",
                        etat.actif ? "text-ink" : "text-ink-muted",
                      )}
                    >
                      {etat.libelle}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-ink-subtle">
                      {etat.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* ─── Actions ─────────────────────────────────────────────── */}
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Actions"
              description="Chaque décision est enregistrée dans le journal d'audit."
            />

            {estMonCompte && (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-secondary-pale p-3 text-[13px] leading-relaxed text-ink-muted">
                <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-secondary" aria-hidden />
                Il s&apos;agit de votre propre compte : le blocage et le retrait
                de rôle sont désactivés.
              </p>
            )}

            <div className="mt-4 space-y-2">
              <form action={validerCompte}>
                <input type="hidden" name="id" value={compte.id} />
                <input
                  type="hidden"
                  name="valide"
                  value={String(!compte.compteValide)}
                />
                <Button
                  type="submit"
                  variant={compte.compteValide ? "outline" : "primary"}
                  className="w-full"
                  icon={<ShieldCheck className="size-3.5" />}
                >
                  {compte.compteValide ? "Retirer la validation" : "Valider le compte"}
                </Button>
              </form>

              <form action={bloquerCompte}>
                <input type="hidden" name="id" value={compte.id} />
                <input
                  type="hidden"
                  name="bloque"
                  value={String(!compte.estBloque)}
                />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={estMonCompte}
                  className={cn(
                    "w-full",
                    !compte.estBloque && "border-danger text-danger hover:bg-danger-pale",
                  )}
                  icon={<ShieldOff className="size-3.5" />}
                >
                  {compte.estBloque ? "Débloquer l'accès" : "Bloquer l'accès"}
                </Button>
              </form>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Rôle"
              description="La certification d'un point focal engage le Laboratoire."
            />

            <div className="mt-4 space-y-2">
              {(Object.values(ROLES) as UserRole[]).map((role) => {
                const actuel = role === compte.role;
                const interdit = estMonCompte && role !== ROLES.ADMIN_LABO;

                return (
                  <form key={role} action={changerRole}>
                    <input type="hidden" name="id" value={compte.id} />
                    <input type="hidden" name="role" value={role} />
                    <button
                      type="submit"
                      disabled={actuel || interdit}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left",
                        "text-[14px] ring-1 transition-all duration-150",
                        actuel
                          ? "bg-primary-pale font-semibold text-primary ring-primary/30"
                          : "bg-surface ring-hairline hover:-translate-y-px hover:shadow-sm hover:ring-primary/25",
                        interdit && "cursor-not-allowed opacity-50 hover:translate-y-0 hover:shadow-none",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <KeyRound className="size-3.5 shrink-0" aria-hidden />
                        {ROLE_LABELS[role]}
                      </span>
                      {actuel && (
                        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider">
                          Actuel
                        </span>
                      )}
                    </button>
                  </form>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
