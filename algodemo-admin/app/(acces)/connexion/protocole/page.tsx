import { ArrowRight, Eye, ShieldCheck, Gavel, FileText, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { acceptProtocol } from "@/lib/auth/actions";

export const metadata = { title: "Protocole de responsabilité" };

const CLAUSES = [
  {
    icon: Eye,
    title: "Engagement de transparence",
    body: "Chaque action de certification, de modération ou de modification du référentiel est soumise à un protocole de traçabilité strict.",
  },
  {
    icon: ShieldCheck,
    title: "Confidentialité (RG-USR-07)",
    body: "Les données des citoyens relèvent du secret professionnel. Tout usage abusif entraîne la révocation immédiate des droits et des poursuites.",
  },
  {
    icon: Gavel,
    title: "Responsabilité des actes",
    body: "Vos interventions impactent le débat public. Vous vous engagez à agir avec impartialité et probité, selon la seule charte de vérification.",
  },
];

export default async function ProtocolePage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <>
      <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-secondary">
        <span className="h-px w-6 bg-secondary" aria-hidden />
        Étape 3 sur 3
      </p>

      <h2 className="mt-4 font-heading text-[34px] font-semibold leading-tight text-ink">
        Protocole de responsabilité
      </h2>
      <p className="mt-2 font-mono text-[12px] text-ink-subtle">
        Réf. RG-USR-07 — Traçabilité et engagement civique
      </p>

      <div className="mt-8 space-y-5">
        {CLAUSES.map((clause) => (
          <section key={clause.title} className="flex gap-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-pale">
              <clause.icon className="size-4 text-primary" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="font-heading text-[16px] font-semibold text-ink">
                {clause.title}
              </h3>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-muted">
                {clause.body}
              </p>
            </div>
          </section>
        ))}
      </div>

      {erreur === "acceptation" && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-lg bg-danger-pale p-4"
        >
          <CircleAlert className="mt-0.5 size-[18px] shrink-0 text-danger" aria-hidden />
          <p className="text-[14px] leading-relaxed text-danger">
            Vous devez accepter le protocole pour accéder à l&apos;administration.
          </p>
        </div>
      )}

      {/* L'acceptation est vérifiée côté serveur : le `required` du navigateur
          seul se contourne, et cette acceptation engage juridiquement. */}
      <form action={acceptProtocol} className="mt-8">
        <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-surface-raised p-4 ring-1 ring-hairline transition-shadow hover:ring-primary/25">
          <input
            type="checkbox"
            name="acceptation"
            required
            className="mt-0.5 size-4 shrink-0 accent-[var(--color-primary)]"
          />
          <span className="text-[14px] leading-relaxed text-ink">
            J&apos;ai pris connaissance de mes responsabilités et j&apos;accepte
            les conditions de traçabilité liées à mes actions administratives.
          </span>
        </label>

        <Button
          type="submit"
          size="lg"
          className="mt-5 w-full"
          icon={<ArrowRight className="size-4" />}
          iconPosition="right"
        >
          Accéder au tableau de bord
        </Button>
      </form>

      <a
        href="#"
        className="mt-5 inline-flex items-center gap-2 text-[13px] font-medium text-ink-muted transition-colors hover:text-primary"
      >
        <FileText className="size-3.5" aria-hidden />
        Consulter la charte complète
      </a>
    </>
  );
}
