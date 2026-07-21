/**
 * Niveaux de vérification des contenus du Feed.
 * Source : Cahier des charges, processus de vérification 3 niveaux (RG-FEED-01).
 */

export const VERIFICATION_LEVELS = {
  LEVEL_1: {
    id: 1,
    label: 'Vérifié Niveau 1',
    description: 'Première analyse et collecte des faits par les utilisateurs ou contributeurs.',
    colorToken: 'info',
  },
  LEVEL_2: {
    id: 2,
    label: 'Vérifié Niveau 2',
    description: 'Validation intermédiaire avec recoupement des sources par un point focal certifié.',
    colorToken: 'warning',
  },
  LEVEL_3: {
    id: 3,
    label: 'Vérifié Niveau 3',
    description: 'Validation finale rigoureuse par le comité scientifique du Laboratoire.',
    colorToken: 'success',
  },
} as const;

export type VerificationLevel = keyof typeof VERIFICATION_LEVELS;
