import { Scale, ShieldCheck, Activity, Lock } from "lucide-react";
import { NetworkMotif } from "./NetworkMotif";

const PROMISES = [
  { icon: Activity, label: "Analyse des données en temps réel" },
  { icon: ShieldCheck, label: "Sources vérifiées et traçables" },
  { icon: Lock, label: "Accès chiffré et restreint" },
];

const SUPPORT_EMAIL = "support@lab.algodemo.org";

/**
 * Panneau d'identité du parcours d'accès.
 *
 * Éditorial plutôt qu'illustratif : une affirmation forte en serif dit ce que
 * fait la plateforme. Le vert profond est assumé sur toute la hauteur — c'est
 * lui qui donne son caractère à l'écran, et il rend au passage la colonne du
 * formulaire lumineuse par contraste.
 */
export function BrandPanel() {
  return (
    <aside className="relative isolate flex flex-col justify-between overflow-hidden bg-rail px-8 py-10 lg:px-12 lg:py-14">
      <NetworkMotif />

      {/* Halo qui décolle le texte du motif, sans le masquer. */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_30%,rgba(36,57,28,0.75),rgba(36,57,28,0.35))]"
        aria-hidden
      />

      <div className="relative flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-rail-raised ring-1 ring-rail-line">
          <Scale className="size-6 text-secondary" aria-hidden />
        </span>
        <span className="font-heading text-[22px] font-semibold text-rail-ink">
          Algo<span className="text-secondary">Démo</span>
        </span>
      </div>

      <div className="relative my-10 max-w-lg">
        <h1 className="font-heading text-[clamp(2.25rem,4vw,3.25rem)] font-semibold leading-[1.08] text-rail-ink">
          Une démocratie éclairée commence par une{" "}
          <em className="italic text-secondary-light">information partagée.</em>
        </h1>

        <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/65">
          La plateforme d&apos;analyse civique qui met les données publiques au
          service du débat, pas l&apos;inverse.
        </p>
      </div>

      <div className="relative">
        <ul className="space-y-3">
          {PROMISES.map((promise) => (
            <li key={promise.label} className="flex items-center gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary/15">
                <promise.icon className="size-3.5 text-secondary" aria-hidden />
              </span>
              <span className="text-[14px] text-white/80">{promise.label}</span>
            </li>
          ))}
        </ul>

        <p className="mt-8 border-t border-rail-line pt-5 text-[13px] text-white/45">
          Une question ?{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-mono text-white/70 underline-offset-4 transition-colors hover:text-secondary hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </aside>
  );
}
