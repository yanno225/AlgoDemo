/**
 * AlgoDémo Design System
 *
 * Palette extraite du logo FID (Innovation Foundation for Democracy)
 * et du logo AlgoDémo (balance de justice vert olive foncé).
 *
 * - Vert olive foncé (#2D4A22) : identité principale AlgoDémo
 * - Doré/moutarde (#C9952B) : accent chaleureux, héritage FID
 * - Rouge corail (#C93C3C) : signalements, alertes, live
 * - Crème chaud (#F0EBE0) : fond principal, douceur, lisibilité
 */

// ─── Couleurs de marque (issues des logos) ───────────────────────────
const BRAND = {
  greenDark: '#2D4A22',     // Logo AlgoDémo — icône app
  greenMedium: '#3A6B2A',   // Variante du vert — hover / accent
  greenLight: '#4A8C3A',    // Vert clair — tags, badges succès
  greenPale: '#E8F5E4',     // Vert très pâle — fond léger

  gold: '#C9952B',          // Logo FID — doré/moutarde
  goldLight: '#D4AD4B',     // Doré clair — hover
  goldPale: '#FDF5E6',      // Doré très pâle — fond highlight

  red: '#C93C3C',           // Logo FID — rouge corail
  redLight: '#E05A5A',      // Rouge clair — hover
  redPale: '#FDEAEA',       // Rouge pâle — fond erreur

  olive: '#6B5B2D',         // Logo FID — olive/brun
  yellow: '#E8C840',        // Logo FID — jaune vif
} as const;

// ─── Palette Light Mode ──────────────────────────────────────────────
export const lightColors = {
  // Couleurs principales
  primary: BRAND.greenDark,
  primaryMedium: BRAND.greenMedium,
  primaryLight: BRAND.greenLight,
  primaryPale: BRAND.greenPale,

  // Couleurs secondaires
  secondary: BRAND.gold,
  secondaryLight: BRAND.goldLight,
  secondaryPale: BRAND.goldPale,

  // Accent / Danger
  accent: BRAND.red,
  accentLight: BRAND.redLight,
  accentPale: BRAND.redPale,

  // Surfaces
  background: '#F0EBE0',       // Crème chaud (même teinte que fond du logo AlgoDémo)
  surface: '#FFFFFF',           // Cartes, modals
  surfaceElevated: '#FAFAF7',  // Surface légèrement élevée
  border: '#E0D8CC',           // Bordures subtiles
  borderLight: '#F0E8DC',      // Bordures très légères

  // Textes
  textPrimary: '#1B1B1E',     // Texte principal — quasi-noir
  textSecondary: '#6C6C70',   // Texte secondaire
  textTertiary: '#9C9CA0',    // Texte tertiaire (légendes)
  textInverse: '#FFFFFF',     // Texte sur fond sombre
  textLink: BRAND.greenMedium,// Liens cliquables

  // Statuts
  success: '#2D8B4E',         // Vérifié, validé
  warning: BRAND.gold,        // Avertissement
  error: BRAND.red,           // Erreur
  info: '#2A7FBA',            // Information

  // Spécifiques métier
  official: BRAND.gold,       // Badge "Officiel" (RG-FEED-04)
  verified: BRAND.greenLight, // Badge "Vérifié"
  live: BRAND.red,            // Indicateur Live

  // Thématiques — couleurs dédiées pour chaque filtre
  thematic: {
    genreSociete: '#8B5CF6',     // Violet
    jeunesseSociete: '#F59E0B',  // Ambre
    droit: BRAND.greenDark,      // Vert (couleur de marque)
    politique: '#3B82F6',        // Bleu
    societeVivant: '#10B981',    // Émeraude
  },

  // Overlay & ombres
  overlay: 'rgba(27, 27, 30, 0.5)',
  shadow: 'rgba(45, 74, 34, 0.08)',
  shadowMedium: 'rgba(45, 74, 34, 0.12)',
  shadowStrong: 'rgba(45, 74, 34, 0.20)',

  // Bottom tab bar
  tabBar: 'rgba(255, 255, 255, 0.92)',
  tabBarBorder: 'rgba(224, 216, 204, 0.6)',
  tabActive: BRAND.greenDark,
  tabInactive: '#9C9CA0',
} as const;

// ─── Palette Dark Mode ───────────────────────────────────────────────
export const darkColors = {
  primary: '#4A8C3A',
  primaryMedium: '#5AA84A',
  primaryLight: '#6BC45A',
  primaryPale: '#1A2E14',

  secondary: '#D4AD4B',
  secondaryLight: '#E0C06A',
  secondaryPale: '#2A2412',

  accent: '#E05A5A',
  accentLight: '#F07070',
  accentPale: '#2E1515',

  background: '#0D1117',
  surface: '#161B22',
  surfaceElevated: '#1C2333',
  border: '#30363D',
  borderLight: '#21262D',

  textPrimary: '#F0F6FC',
  textSecondary: '#8B949E',
  textTertiary: '#6E7681',
  textInverse: '#0D1117',
  textLink: '#5AA84A',

  success: '#3FB950',
  warning: '#D4AD4B',
  error: '#E05A5A',
  info: '#58A6FF',

  official: '#D4AD4B',
  verified: '#5AA84A',
  live: '#E05A5A',

  thematic: {
    genreSociete: '#A78BFA',
    jeunesseSociete: '#FBBF24',
    droit: '#4A8C3A',
    politique: '#60A5FA',
    societeVivant: '#34D399',
  },

  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowMedium: 'rgba(0, 0, 0, 0.4)',
  shadowStrong: 'rgba(0, 0, 0, 0.5)',

  tabBar: 'rgba(22, 27, 34, 0.95)',
  tabBarBorder: 'rgba(48, 54, 61, 0.6)',
  tabActive: '#5AA84A',
  tabInactive: '#6E7681',
} as const;

// ─── Typographie ─────────────────────────────────────────────────────
export const typography = {
  // Familles (Google Fonts chargées via expo-font)
  families: {
    heading: 'PlusJakartaSans-Bold',
    headingSemiBold: 'PlusJakartaSans-SemiBold',
    body: 'Inter-Regular',
    bodyMedium: 'Inter-Medium',
    bodySemiBold: 'Inter-SemiBold',
    bodyBold: 'Inter-Bold',
    caption: 'Inter-Medium',
  },

  // Tailles (jamais figées — valeurs de référence, toujours via tokens)
  sizes: {
    /** 32px — titres d'écran */
    h1: 32,
    /** 24px — titres de section */
    h2: 24,
    /** 20px — sous-titres */
    h3: 20,
    /** 18px — sous-titres légers */
    h4: 18,
    /** 16px — corps principal */
    body: 16,
    /** 14px — corps secondaire */
    bodySmall: 14,
    /** 12px — légendes, badges */
    caption: 12,
    /** 10px — micro-textes */
    micro: 10,
  },

  // Hauteurs de ligne
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },

  // Graisses
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
} as const;

// ─── Spacing (multiple de 4) ─────────────────────────────────────────
export const spacing = {
  /** 2px */
  xxs: 2,
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  xxl: 24,
  /** 32px */
  xxxl: 32,
  /** 40px */
  huge: 40,
  /** 48px */
  massive: 48,
  /** 64px */
  giant: 64,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────
export const borderRadius = {
  /** 4px — badges, petits éléments */
  xs: 4,
  /** 8px — inputs, tags */
  sm: 8,
  /** 12px — boutons */
  md: 12,
  /** 16px — cartes */
  lg: 16,
  /** 20px — cartes larges */
  xl: 20,
  /** 24px — bottom sheets */
  xxl: 24,
  /** 999px — pilules */
  full: 999,
} as const;

// ─── Ombres (3 niveaux) ──────────────────────────────────────────────
export const shadows = {
  /** Ombre subtile pour cartes */
  sm: {
    shadowColor: '#2D4A22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  /** Ombre moyenne pour éléments élevés */
  md: {
    shadowColor: '#2D4A22',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  /** Ombre forte pour modals, bottom sheets */
  lg: {
    shadowColor: '#2D4A22',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
} as const;

// ─── Animations ──────────────────────────────────────────────────────
export const animations = {
  /** Durée rapide — micro-interactions */
  fast: 150,
  /** Durée normale — transitions d'état */
  normal: 300,
  /** Durée lente — entrées/sorties d'écran */
  slow: 500,
  /** Spring config pour animations fluides */
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  /** Spring config pour rebond */
  bounce: {
    damping: 10,
    stiffness: 200,
    mass: 0.8,
  },
} as const;

// ─── Zone de toucher minimale (accessibilité) ────────────────────────
export const hitSlop = {
  /** Zone minimale 44x44pt (WCAG) */
  default: { top: 10, bottom: 10, left: 10, right: 10 },
  /** Zone étendue pour petits boutons */
  large: { top: 16, bottom: 16, left: 16, right: 16 },
} as const;

// ─── Opacité de couleur ──────────────────────────────────────────────
/**
 * Applique une opacité à une couleur hexadécimale.
 *
 * Remplace la concaténation `${color}15` répandue dans le code : celle-ci
 * produit une chaîne invalide dès que la couleur source est déjà en 8 chiffres
 * ou en `rgba()`, et l'opacité obtenue n'est pas lisible (15 hex = 8%).
 *
 * Marquée `worklet` : elle reste appelable depuis le thread JS, et le devient
 * aussi depuis un `useAnimatedStyle`. Sans cette directive, la fonction
 * capturée dans un worklet y arrive sérialisée en objet — d'où l'erreur
 * « withAlpha is not a function (it is Object) » au moment de l'exécution.
 * Préférer malgré tout le calcul hors worklet : la conversion n'a aucune
 * raison d'être refaite à chaque frame.
 *
 * @param color couleur source (`#RGB` ou `#RRGGBB`)
 * @param alpha opacité de 0 à 1
 */
export const withAlpha = (color: string, alpha: number): string => {
  'worklet';
  const clamped = Math.max(0, Math.min(1, alpha));

  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (hex.length !== 6) return color; // rgba()/named color — laissé tel quel

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${clamped})`;
};

// ─── Motion — courbes partagées par toute l'app ──────────────────────
/**
 * Configs Reanimated centralisées. Toute animation passe par ces tokens :
 * c'est ce qui donne à l'app une signature de mouvement cohérente plutôt
 * qu'un ressenti différent d'un écran à l'autre.
 */
export const motion = {
  /** Feedback de pression — vif, sans rebond parasite (100-150ms perçus) */
  press: { damping: 18, stiffness: 320, mass: 0.6 },
  /** Entrée d'élément — souple, légèrement vivant */
  enter: { damping: 18, stiffness: 160, mass: 0.9 },
  /** Déplacement d'indicateur (pills, onglets) — glisse net et rapide */
  slide: { damping: 20, stiffness: 220, mass: 0.8 },
  /** Célébration (vote validé, badge obtenu) — rebond assumé */
  bounce: { damping: 9, stiffness: 220, mass: 0.7 },

  durations: {
    /** 140ms — micro-interaction (focus, press) */
    micro: 140,
    /** 260ms — transition d'état */
    base: 260,
    /** 380ms — entrée d'écran, plafond avant effet « lent » */
    slow: 380,
    /** 800ms — remplissage de jauge / anneau au montage */
    gauge: 800,
  },

  /** Décalage entre items d'une liste en cascade */
  stagger: 45,

  /** Échelles de pression selon la taille de la cible */
  scale: {
    /** Grandes surfaces (cards) — le scale doit rester discret */
    card: 0.985,
    /** Boutons standards */
    button: 0.96,
    /** Petites cibles (icônes, pills) */
    chip: 0.93,
  },
} as const;

// ─── Dégradés ────────────────────────────────────────────────────────
/**
 * Le voile sombre appliqué sous le texte des médias plein écran (feed
 * immersif, bannières). Trois arrêts plutôt que deux : un dégradé linéaire
 * simple laisse une frontière visible en haut du voile.
 */
export const scrimGradient = [
  'transparent',
  'rgba(12, 16, 10, 0.35)',
  'rgba(12, 16, 10, 0.82)',
  'rgba(12, 16, 10, 0.95)',
] as const;

export const scrimLocations = [0, 0.35, 0.72, 1] as const;

/** Voile court en haut d'un média — lisibilité des contrôles superposés */
export const topScrimGradient = [
  'rgba(12, 16, 10, 0.55)',
  'transparent',
] as const;

/**
 * Dégradés de repli par thématique. Utilisés quand un contenu n'a pas
 * d'image : la règle de design interdit le bloc gris avec icône cassée.
 */
export const thematicGradients = {
  genreSociete: ['#A78BFA', '#7C3AED'],
  jeunesseSociete: ['#FBBF24', '#D97706'],
  droit: ['#4A8C3A', '#2D4A22'],
  politique: ['#60A5FA', '#2563EB'],
  societeVivant: ['#34D399', '#059669'],
  brand: ['#3A6B2A', '#2D4A22'],
} as const;

// ─── Verre dépoli (tab bar, en-têtes flottants) ──────────────────────
export const glass = {
  light: {
    intensity: 60,
    tint: 'light' as const,
    overlay: 'rgba(255, 255, 255, 0.55)',
    hairline: 'rgba(45, 74, 34, 0.10)',
  },
  dark: {
    intensity: 40,
    tint: 'dark' as const,
    overlay: 'rgba(13, 17, 23, 0.55)',
    hairline: 'rgba(255, 255, 255, 0.08)',
  },
} as const;

// ─── Type utilitaire ─────────────────────────────────────────────────
export type ColorScheme = typeof lightColors;
export type ThemeMode = 'light' | 'dark';
export type ThematicGradientKey = keyof typeof thematicGradients;
