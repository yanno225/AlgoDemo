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

const normaliser = (texte: string) =>
  texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

/**
 * Habillage visuel d'une thématique à partir de son LIBELLÉ backend.
 *
 * Le backend identifie les thématiques par UUID et libellé (« Genre et
 * Société »…) ; la charte FID, elle, est indexée ici. La correspondance se
 * fait sur le libellé normalisé (casse et accents ignorés) pour survivre à
 * une retouche typographique. Une thématique inconnue reçoit un habillage
 * neutre plutôt que de faire échouer la page.
 */
export const getThematicByLabel = (libelle: string) =>
  THEMATICS.find(
    (thematic) => normaliser(thematic.label) === normaliser(libelle),
  );
