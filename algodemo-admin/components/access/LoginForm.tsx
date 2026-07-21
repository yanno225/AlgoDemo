"use client";

import { useState } from "react";
import { Mail, ArrowRight, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "./PasswordInput";
import { cn } from "@/lib/cn";

/**
 * Comptes de démonstration proposés au pré-remplissage.
 *
 * TODO(backend) : bloc entier à retirer au branchement de l'authentification.
 */
const DEMO_ACCOUNTS = [
  { email: "admin@algodemo.org", role: "Administrateur" },
  { email: "focal@algodemo.org", role: "Point focal" },
];

const MIN_PASSWORD_LENGTH = 4;

interface LoginFormProps {
  /** Action serveur de connexion. */
  action: (formData: FormData) => Promise<void>;
}

/**
 * Formulaire de connexion.
 *
 * La validation est faite au moment de la soumission puis maintenue à jour à
 * la frappe : signaler une erreur avant que l'utilisateur ait fini d'écrire
 * revient à le corriger pendant qu'il parle.
 */
export function LoginForm({ action }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const emailError =
    submitted && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
      ? "Saisissez une adresse email complète."
      : undefined;

  const passwordError =
    submitted && password.length < MIN_PASSWORD_LENGTH
      ? `Le mot de passe compte au moins ${MIN_PASSWORD_LENGTH} caractères.`
      : undefined;

  const isValid = !emailError && !passwordError && email && password;

  return (
    <form
      action={action}
      onSubmit={(event) => {
        setSubmitted(true);
        // La validation navigateur ne suffit pas : elle laisserait passer une
        // soumission au clavier avant que l'état local ne soit à jour.
        if (
          !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
          password.length < MIN_PASSWORD_LENGTH
        ) {
          event.preventDefault();
        }
      }}
      noValidate
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="identifiant"
          className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-muted"
        >
          Identifiant ou email
        </label>

        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden
          />
          <input
            id="identifiant"
            name="identifiant"
            type="email"
            autoComplete="username"
            placeholder="nom@algodemo.org"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "erreur-identifiant" : undefined}
            className={cn(
              "h-12 w-full rounded-lg bg-surface-raised pl-11 pr-4 font-mono text-[14px] text-ink",
              "ring-1 transition-shadow placeholder:font-sans placeholder:text-ink-subtle",
              "focus:outline-none focus-visible:ring-2",
              emailError
                ? "ring-danger focus-visible:ring-danger"
                : "ring-line-soft focus-visible:ring-primary-medium"
            )}
          />
        </div>

        {emailError && <FieldError id="erreur-identifiant">{emailError}</FieldError>}
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <label
            htmlFor="motdepasse"
            className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-muted"
          >
            Mot de passe
          </label>
          <a
            href="#"
            className="text-[12px] font-semibold text-secondary underline-offset-4 transition-colors hover:underline"
          >
            Mot de passe oublié ?
          </a>
        </div>

        <PasswordInput
          id="motdepasse"
          name="motdepasse"
          value={password}
          onValueChange={setPassword}
          hasError={!!passwordError}
          describedBy={passwordError ? "erreur-motdepasse" : undefined}
        />

        {passwordError && <FieldError id="erreur-motdepasse">{passwordError}</FieldError>}
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-ink-muted">
        <input
          type="checkbox"
          name="memoriser"
          className="size-4 accent-[var(--color-primary)]"
        />
        Rester connecté sur cet appareil
      </label>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        icon={<ArrowRight className="size-4" />}
        iconPosition="right"
      >
        Se connecter
      </Button>

      {/* ─── Comptes de démonstration ─────────────────────────────── */}
      <div className="rounded-xl bg-surface-raised p-4 ring-1 ring-hairline">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
          Comptes de démonstration
        </p>

        <ul className="mt-3 space-y-2">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setSubmitted(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2.5",
                  "ring-1 transition-all duration-150 hover:-translate-y-px hover:shadow-sm",
                  email === account.email
                    ? "ring-primary/40"
                    : "ring-hairline hover:ring-primary/25"
                )}
              >
                <span className="truncate font-mono text-[13px] text-ink">
                  {account.email}
                </span>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                  {account.role}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-[12px] leading-relaxed text-ink-subtle">
          Cliquez un compte pour le pré-remplir. Mot de passe : n&apos;importe
          quelle valeur d&apos;au moins {MIN_PASSWORD_LENGTH} caractères.
        </p>
      </div>

      {/* Repère discret : l'état du bouton ne dit pas pourquoi il refuse. */}
      {submitted && !isValid && (
        <p className="sr-only" role="status">
          Le formulaire comporte des erreurs.
        </p>
      )}
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-danger"
    >
      <CircleAlert className="size-3.5 shrink-0" aria-hidden />
      {children}
    </p>
  );
}
