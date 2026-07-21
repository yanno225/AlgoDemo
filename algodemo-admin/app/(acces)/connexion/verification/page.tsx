import Link from "next/link";
import { ShieldCheck, ArrowRight, ArrowLeft, LockKeyhole, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/access/OtpInput";
import { verifyCode } from "@/lib/auth/actions";

export const metadata = { title: "Vérification de sécurité" };

const CODE_LENGTH = 6;

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <>
      <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-secondary">
        <span className="h-px w-6 bg-secondary" aria-hidden />
        Étape 2 sur 3
      </p>

      <span className="mt-6 grid size-12 place-items-center rounded-xl bg-primary-pale">
        <ShieldCheck className="size-6 text-primary" aria-hidden />
      </span>

      <h2 className="mt-5 font-heading text-[34px] font-semibold leading-tight text-ink">
        Vérification de sécurité
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
        Saisissez le code envoyé à votre adresse e-mail ou par SMS.
      </p>

      {erreur === "code" && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-lg bg-danger-pale p-4"
        >
          <CircleAlert className="mt-0.5 size-[18px] shrink-0 text-danger" aria-hidden />
          <p className="text-[14px] leading-relaxed text-danger">
            Saisissez les {CODE_LENGTH} chiffres du code reçu.
          </p>
        </div>
      )}

      <form action={verifyCode} className="mt-8">
        <p
          id="code-label"
          className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-muted"
        >
          Code à {CODE_LENGTH} chiffres
        </p>

        <div aria-labelledby="code-label">
          <OtpInput name="code" length={CODE_LENGTH} />
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-7 w-full"
          icon={<ArrowRight className="size-4" />}
          iconPosition="right"
        >
          Vérifier
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="text-[14px] font-semibold text-secondary underline-offset-4 transition-colors hover:underline"
        >
          Renvoyer le code
        </button>
        <p className="text-[13px] text-ink-subtle">Reçu sous 2 minutes.</p>
      </div>

      <p className="mt-8 flex items-center gap-2 border-t border-hairline pt-5 text-[12px] text-ink-subtle">
        <LockKeyhole className="size-3.5 shrink-0" aria-hidden />
        Session sécurisée par chiffrement de bout en bout
      </p>

      <Link
        href="/connexion"
        className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-ink-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Revenir à la connexion
      </Link>
    </>
  );
}
