/**
 * Les 5 thématiques fixes du projet AlgoDémo (RG-THE-01).
 *
 * ⚠️ Ne jamais modifier cette liste sans confirmation explicite du comité de
 * pilotage. Miroir de `algodemo/constants/thematics.ts`.
 */

export const THEMATICS = [
  {
    id: "genre_societe",
    label: "Genre et Société",
    /** Classe utilitaire de la couleur dédiée, définie dans `globals.css`. */
    color: "genre",
  },
  {
    id: "jeunesse_societe",
    label: "Jeunesse et Société",
    color: "jeunesse",
  },
  {
    id: "droit",
    label: "Droit",
    color: "droit",
  },
  {
    id: "politique",
    label: "Politique",
    color: "politique",
  },
  {
    id: "societe_vivant",
    label: "Société et Vivant",
    color: "vivant",
  },
] as const;

export type ThematicId = (typeof THEMATICS)[number]["id"];

export const getThematic = (id: string) =>
  THEMATICS.find((thematic) => thematic.id === id);
