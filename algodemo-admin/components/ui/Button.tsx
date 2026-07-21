import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface BaseProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  className?: string;
}

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    href?: never;
  };

type ButtonAsLink = BaseProps & {
  href: string;
  /** Ouvre dans un nouvel onglet — réservé aux destinations externes. */
  external?: boolean;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-ink-inverse shadow-sm hover:bg-primary-medium active:bg-primary",
  secondary:
    // Le doré est trop clair pour du texte blanc : texte sombre pour le contraste AA.
    "bg-secondary text-ink shadow-sm hover:bg-secondary-light",
  outline:
    "border-[1.5px] border-primary text-primary bg-transparent hover:bg-primary-pale",
  ghost: "text-ink-muted hover:bg-surface-raised hover:text-ink",
  danger: "bg-danger text-ink-inverse shadow-sm hover:opacity-90",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[14px] gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  // Réservé aux actions principales isolées : soumission d'un parcours
  // d'accès, validation d'un formulaire long.
  lg: "h-12 px-6 text-[15px] gap-2",
};

const BASE =
  "inline-flex items-center justify-center rounded-md font-semibold whitespace-nowrap " +
  "transition-all duration-150 ease-[var(--ease-out-soft)] active:scale-[0.97] " +
  "disabled:pointer-events-none disabled:opacity-50";

/**
 * Bouton du back-office.
 *
 * Rend un `<a>` dès qu'un `href` est fourni : une navigation doit rester un
 * lien véritable — clic milieu, ouverture dans un onglet et lecteurs d'écran
 * en dépendent.
 */
export function Button(props: ButtonProps) {
  const {
    children,
    variant = "primary",
    size = "md",
    icon,
    iconPosition = "left",
    className,
  } = props;

  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);

  const content = (
    <>
      {iconPosition === "left" && icon}
      {children}
      {iconPosition === "right" && icon}
    </>
  );

  if ("href" in props && props.href) {
    const { href, external } = props;
    return (
      <Link
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {content}
      </Link>
    );
  }

  return (
    <button type="button" {...toDomProps(props)} className={classes}>
      {content}
    </button>
  );
}

/**
 * Props propres au composant, à ne jamais transmettre au DOM.
 *
 * React laisse passer les attributs inconnus en minuscules sans broncher,
 * mais avertit sur les noms en casse mixte — d'où le message
 * « React does not recognize the `iconPosition` prop ». Au-delà de
 * l'avertissement, ces attributs se retrouvent réellement dans le HTML.
 */
const OWN_PROPS = new Set([
  "children",
  "variant",
  "size",
  "icon",
  "iconPosition",
  "className",
  "href",
  "external",
]);

/** Ne conserve que les attributs destinés à l'élément natif. */
function toDomProps(props: ButtonProps): ButtonHTMLAttributes<HTMLButtonElement> {
  const domProps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (!OWN_PROPS.has(key)) domProps[key] = value;
  }

  return domProps as ButtonHTMLAttributes<HTMLButtonElement>;
}
