import Image from "next/image";
import { Scale, ShieldCheck, Activity, Lock } from "lucide-react";

const PROMISES = [
  { icon: Activity, label: "Analyse des données en temps réel" },
  { icon: ShieldCheck, label: "Sources vérifiées et traçables" },
  { icon: Lock, label: "Accès chiffré et restreint" },
];

const SUPPORT_EMAIL = "support@lab.algodemo.org";

/**
 * Panneau d'identité du parcours d'accès.
 *
 * L'allégorie de la Justice devant l'hémicycle porte l'identité : balance,
 * vert institutionnel, lumière dorée — l'image dit le sujet au lieu de le
 * décorer. La statue vit à droite, le texte à gauche ; deux voiles assurent
 * la lisibilité sans éteindre l'image :
 *
 * - un dégradé horizontal, dense sous le texte, qui s'efface vers la statue ;
 * - un dégradé vertical qui assoit la liste des promesses et le pied de page.
 *
 * Le fond `bg-rail` reste sous l'image : pendant son chargement, le panneau
 * est déjà aux couleurs de la marque, sans éclair blanc.
 */
export function BrandPanel() {
  return (
    <aside className="relative isolate flex flex-col justify-between overflow-hidden bg-rail px-8 py-10 lg:px-12 lg:py-14">
      <Image
        src="/justice-hall.webp"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 52vw, 100vw"
        className="object-cover object-[70%_center]"
      />

      {/* Voile horizontal — le texte se lit, la statue respire. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(36,57,28,0.92) 0%, rgba(36,57,28,0.62) 45%, rgba(36,57,28,0.18) 100%)",
        }}
        aria-hidden
      />

      {/* Voile vertical — assoit les promesses et le pied de page. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(36,57,28,0.88) 0%, rgba(36,57,28,0.25) 38%, rgba(36,57,28,0.15) 100%)",
        }}
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

        <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/75">
          La plateforme d&apos;analyse civique qui met les données publiques au
          service du débat, pas l&apos;inverse.
        </p>
      </div>

      <div className="relative">
        <ul className="space-y-3">
          {PROMISES.map((promise) => (
            <li key={promise.label} className="flex items-center gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary/20 ring-1 ring-secondary/30">
                <promise.icon className="size-3.5 text-secondary-light" aria-hidden />
              </span>
              <span className="text-[14px] font-medium text-white/85">
                {promise.label}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-8 border-t border-white/15 pt-5 text-[13px] text-white/55">
          Une question ?{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-mono text-white/80 underline-offset-4 transition-colors hover:text-secondary hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </aside>
  );
}
