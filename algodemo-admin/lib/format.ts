/**
 * Formatage des dates et des nombres.
 *
 * Locale fixée à `fr-FR` : la langue d'interface est le français, et le
 * formatage ne doit pas dépendre des réglages du poste de l'administrateur —
 * deux agents doivent lire exactement la même chose.
 */

const LOCALE = "fr-FR";

export const formatNumber = (value: number) =>
  new Intl.NumberFormat(LOCALE).format(value);

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));

export const formatShortDate = (iso: string) =>
  new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "short",
  }).format(new Date(iso));

export const formatTime = (iso: string) =>
  new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

/**
 * Écart en jours entre aujourd'hui et une échéance.
 * Négatif si la date est passée.
 */
export const daysUntil = (iso: string) => {
  const target = new Date(iso).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / 86_400_000);
};

/** Libellé d'échéance : « J-14 », « Dernier jour », « Clôturée ». */
export const formatDeadline = (iso: string) => {
  const days = daysUntil(iso);
  if (days < 0) return "Clôturée";
  if (days === 0) return "Dernier jour";
  return `J-${days}`;
};

/** Ancienneté lisible : « il y a 2 h », « hier », « le 14 juillet 2026 ». */
export const formatRelative = (iso: string) => {
  const elapsed = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(elapsed / 60_000);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;

  const days = Math.round(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;

  return `le ${formatDate(iso)}`;
};
