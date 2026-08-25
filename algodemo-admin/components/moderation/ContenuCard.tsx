import { BadgeCheck, Eye, EyeOff, ShieldCheck, Trash2 } from "lucide-react";
import type { ContenuAModerer, StatutVerification } from "@/lib/data/moderation";
import {
  changerVerification,
  depublierContenu,
  publierContenu,
  supprimerContenu,
} from "@/lib/data/moderation-actions";
import { getThematicByLabel } from "@/lib/domain/thematics";
import { formatRelative } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface ContenuCardProps {
  contenu: ContenuAModerer;
  index?: number;
}

/** Parcours de triangulation (CDC §6.1) : chaque cran est un constat humain. */
const NIVEAUX: { statut: StatutVerification; libelle: string }[] = [
  { statut: "NON_VERIFIE", libelle: "Non vérifié" },
  { statut: "PARTIELLEMENT_VERIFIE", libelle: "Partiellement vérifié" },
  { statut: "VERIFIE", libelle: "Vérifié" },
];

/**
 * Contenu du feed en cours de vérification.
 *
 * La règle RG-FEED-01 est portée par l'interface : le bouton « Publier »
 * n'apparaît qu'une fois le contenu VÉRIFIÉ. L'API ne l'impose pas — c'est un
 * choix d'ergonomie qui rend le bon geste plus facile que le mauvais.
 */
export function ContenuCard({ contenu, index = 0 }: ContenuCardProps) {
  const thematic = contenu.thematique
    ? getThematicByLabel(contenu.thematique.libelle)
    : undefined;
  const accent = thematic
    ? `var(--color-${thematic.color})`
    : "var(--color-primary)";

  const niveauActuel = NIVEAUX.findIndex(
    (n) => n.statut === contenu.statutVerification,
  );
  const prochainNiveau = NIVEAUX[niveauActuel + 1];

  return (
    <article
      className="animate-rise relative flex flex-col overflow-hidden rounded-xl bg-surface p-5 shadow-sm ring-1 ring-hairline"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: accent }}
        aria-hidden
      />

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {contenu.thematique && (
            <p
              className="text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ color: accent }}
            >
              {contenu.thematique.libelle}
            </p>
          )}
          <h3 className="mt-0.5 text-[15px] font-bold leading-snug text-ink">
            {contenu.titre}
          </h3>
        </div>
        <Badge tone={contenu.estPublie ? "success" : "neutral"} dot>
          {contenu.estPublie ? "Publié" : "Non publié"}
        </Badge>
      </header>

      <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-ink-muted">
        {contenu.corps}
      </p>

      <p className="mt-2 text-[12px] text-ink-subtle">
        {contenu.source ? `${contenu.source} · ` : ""}
        {formatRelative(contenu.creeLe)}
      </p>

      {/* ─── Parcours de vérification ──────────────────────────────── */}
      <div className="mt-4">
        <ol className="flex items-center gap-1.5" aria-label="Niveau de vérification">
          {NIVEAUX.map((niveau, i) => (
            <li key={niveau.statut} className="flex-1">
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-colors duration-300",
                  i <= niveauActuel ? "bg-primary" : "bg-line-soft",
                )}
                title={niveau.libelle}
              />
            </li>
          ))}
        </ol>
        <p className="mt-1.5 text-[12px] font-semibold text-ink-muted">
          {NIVEAUX[niveauActuel]?.libelle}
          {prochainNiveau ? ` — prochaine étape : ${prochainNiveau.libelle.toLowerCase()}` : " — prêt à publier"}
        </p>
      </div>

      <footer className="mt-4 space-y-2 border-t border-line-soft pt-4">
        {prochainNiveau && (
          <form action={changerVerification}>
            <input type="hidden" name="id" value={contenu.id} />
            <input type="hidden" name="statut" value={prochainNiveau.statut} />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="w-full"
              icon={<ShieldCheck className="size-3.5" />}
            >
              Passer à « {prochainNiveau.libelle} »
            </Button>
          </form>
        )}

        {/* RG-FEED-01 : pas de diffusion sans triangulation complète. */}
        {!contenu.estPublie && !prochainNiveau && (
          <form action={publierContenu}>
            <input type="hidden" name="id" value={contenu.id} />
            <Button
              type="submit"
              size="sm"
              className="w-full"
              icon={<Eye className="size-3.5" />}
            >
              Publier dans le feed
            </Button>
          </form>
        )}

        {!contenu.estPublie && prochainNiveau && (
          <p className="flex items-center gap-1.5 text-[12px] text-ink-subtle">
            <BadgeCheck className="size-3.5 shrink-0" aria-hidden />
            La publication s&apos;ouvre une fois la vérification complète
            (RG-FEED-01).
          </p>
        )}

        {contenu.estPublie && (
          <form action={depublierContenu}>
            <input type="hidden" name="id" value={contenu.id} />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="w-full border-danger text-danger hover:bg-danger-pale"
              icon={<EyeOff className="size-3.5" />}
            >
              Dépublier
            </Button>
          </form>
        )}

        {/* Suppression définitive en deux temps (details/summary, sans JS) :
            réservée aux ADMIN côté API — préférer « Dépublier » quand un
            retour reste envisageable. */}
        <details>
          <summary className="cursor-pointer list-none text-center text-[12px] font-semibold text-ink-subtle transition-colors hover:text-danger">
            Supprimer définitivement…
          </summary>
          <div className="mt-2 space-y-2 rounded-lg bg-danger-pale p-3">
            <p className="text-[12px] leading-snug text-ink-muted">
              Le contenu, ses commentaires et ses « j&apos;aime » seront effacés
              sans retour possible. Pour un simple retrait du feed, «
              Dépublier » suffit.
            </p>
            <form action={supprimerContenu}>
              <input type="hidden" name="id" value={contenu.id} />
              <Button
                type="submit"
                size="sm"
                variant="danger"
                className="w-full"
                icon={<Trash2 className="size-3.5" />}
              >
                Supprimer définitivement
              </Button>
            </form>
          </div>
        </details>
      </footer>
    </article>
  );
}
