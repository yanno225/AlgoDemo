/**
 * Processus de vérification à 3 niveaux (RG-FEED-01).
 *
 * Un contenu ne devient « Publié » qu'après avoir franchi les trois niveaux.
 * C'est le cœur métier du back-office : la chaîne de confiance qui distingue
 * AlgoDémo d'un simple agrégateur d'actualités.
 */

export const VERIFICATION_LEVELS = [
  {
    level: 1,
    label: "Collecte des faits",
    description:
      "Première analyse et collecte des faits par les contributeurs ou les points focaux.",
    tone: "info",
  },
  {
    level: 2,
    label: "Recoupement des sources",
    description:
      "Validation intermédiaire avec recoupement des sources par un point focal certifié.",
    tone: "warning",
  },
  {
    level: 3,
    label: "Validation scientifique",
    description:
      "Validation finale rigoureuse par le comité scientifique du Laboratoire.",
    tone: "success",
  },
] as const;

export type VerificationLevel = 1 | 2 | 3;

export const getVerificationLevel = (level: VerificationLevel) =>
  VERIFICATION_LEVELS.find((item) => item.level === level);

/**
 * Cycle de vie d'un contenu.
 *
 * `rejected` est un état terminal distinct de `draft` : un contenu écarté
 * garde sa trace et son motif, il ne retourne pas silencieusement en
 * brouillon — c'est une exigence d'auditabilité.
 */
export const CONTENT_STATUSES = [
  "draft",
  "in_review",
  "published",
  "rejected",
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Brouillon",
  in_review: "En vérification",
  published: "Publié",
  rejected: "Écarté",
};
