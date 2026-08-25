/**
 * Filtre du bruit CONNU d'Expo Go — à importer EN PREMIER dans app/_layout.tsx.
 *
 * Depuis le SDK 53, Expo Go ne supporte plus le push DISTANT : au chargement,
 * expo-notifications tente d'auto-enregistrer un token push et le signale par
 * un WARN + un ERROR verbeux. Rien n'est cassé : nos rappels de débats sont
 * des notifications LOCALES, pleinement fonctionnelles ; le push distant
 * (FCM) arrivera avec le build de développement.
 *
 * LogBox ne masque que l'overlay du téléphone — ce filtre intercepte les
 * messages AVANT le crochet Metro, donc le terminal reste propre aussi.
 * Il ne filtre QUE ces deux messages précis : tout le reste passe.
 */

const BRUIT_CONNU = [
  /expo-notifications.*(removed from Expo Go|Expo Go)/i,
  /`expo-notifications` functionality is not fully supported in Expo Go/i,
];

const estBruitConnu = (args: unknown[]): boolean => {
  const texte = args.map((arg) => String(arg)).join(' ');
  return BRUIT_CONNU.some((motif) => motif.test(texte));
};

const erreurOriginale = console.error.bind(console);
const alerteOriginale = console.warn.bind(console);

console.error = (...args: unknown[]) => {
  if (estBruitConnu(args)) return;
  erreurOriginale(...args);
};

console.warn = (...args: unknown[]) => {
  if (estBruitConnu(args)) return;
  alerteOriginale(...args);
};

export {};
