/**
 * Les 5 thématiques fixes du projet AlgoDémo.
 * Source : Cahier des charges, règle RG-THE-01.
 *
 * ⚠️ Ne JAMAIS modifier cette liste sans confirmation explicite
 * du chef de projet / comité de pilotage.
 */

export const THEMATICS = [
  {
    id: 'genre_societe',
    labelKey: 'thematics.genreSociete',
    label: 'Genre et Société',
    icon: 'users',              // Phosphor icon name
    colorToken: 'genreSociete', // Maps to theme.thematic.genreSociete
  },
  {
    id: 'jeunesse_societe',
    labelKey: 'thematics.jeunesseSociete',
    label: 'Jeunesse et Société',
    icon: 'student',
    colorToken: 'jeunesseSociete',
  },
  {
    id: 'droit',
    labelKey: 'thematics.droit',
    label: 'Droit',
    icon: 'scales',
    colorToken: 'droit',
  },
  {
    id: 'politique',
    labelKey: 'thematics.politique',
    label: 'Politique',
    icon: 'bank',
    colorToken: 'politique',
  },
  {
    id: 'societe_vivant',
    labelKey: 'thematics.societeVivant',
    label: 'Société et Vivant',
    icon: 'globe-hemisphere-west',
    colorToken: 'societeVivant',
  },
] as const;

export type ThematicId = (typeof THEMATICS)[number]['id'];
