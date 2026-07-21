import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Actions principales de la page, alignées à droite. */
  actions?: ReactNode;
}

/** En-tête de page : titre, contexte, actions. Commun à tous les écrans. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-heading text-[32px] font-extrabold leading-tight tracking-tight text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
