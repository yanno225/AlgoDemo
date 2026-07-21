import type { Metadata } from "next";
import { Fraunces, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

/**
 * Typographie du back-office.
 *
 * Trois familles, trois rôles distincts — le choix est lié au sujet, pas
 * décoratif :
 *
 * - **Fraunces** porte la voix civique. Serif éditorial, chargé en variable
 *   avec ses axes `opsz` et `SOFT` : le rendu s'adapte à la taille de
 *   composition au lieu d'étirer un même dessin.
 * - **Public Sans** sert l'interface. Elle a été dessinée pour les services
 *   publics américains (US Web Design System), ce qui la rend légitime pour
 *   un outil institutionnel.
 * - **IBM Plex Mono** est réservée aux valeurs exactes — identifiants,
 *   références de dossier, codes du référentiel. La chasse fixe signale
 *   « ceci se saisit ou se cite au caractère près ».
 */
const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
});

const publicSans = Public_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Administration — AlgoDémo",
    template: "%s — AlgoDémo",
  },
  description:
    "Back-office AlgoDémo : gestion des contenus vérifiés, des consultations citoyennes et de la modération.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${publicSans.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
