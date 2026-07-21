import { ShieldAlert } from "lucide-react";
import { signIn } from "@/lib/auth/actions";
import { LoginForm } from "@/components/access/LoginForm";

export const metadata = { title: "Connexion" };

const ERRORS: Record<string, string> = {
  identifiants: "Identifiants incorrects. Vérifiez votre saisie.",
  "acces-refuse":
    "Votre compte n'a pas accès à l'administration. Les citoyens utilisent l'application mobile AlgoDémo.",
};

export default async function ConnexionPage({
  searchParams,
}: {
  // Next 16 : `searchParams` est asynchrone.
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const message = erreur ? ERRORS[erreur] : undefined;

  return (
    <>
      <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-secondary">
        <span className="h-px w-6 bg-secondary" aria-hidden />
        Accès restreint
      </p>

      <h2 className="mt-4 font-heading text-[34px] font-semibold leading-tight text-ink">
        Espace administrateur
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
        Connectez-vous pour accéder à vos outils d&apos;analyse civique.
      </p>

      {message && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-lg bg-danger-pale p-4"
        >
          <ShieldAlert className="mt-0.5 size-[18px] shrink-0 text-danger" aria-hidden />
          <p className="text-[14px] leading-relaxed text-danger">{message}</p>
        </div>
      )}

      <div className="mt-8">
        <LoginForm action={signIn} />
      </div>
    </>
  );
}
