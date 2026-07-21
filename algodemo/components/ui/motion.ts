import {
  FadeInDown,
  FadeIn,
  FadeOut,
  withSpring,
  withTiming,
  Easing,
  EntryExitAnimationFunction,
  EntryAnimationsValues,
} from 'react-native-reanimated';
import { motion } from '../../constants/theme';

/**
 * Fabriques d'animations partagées.
 *
 * Toutes les listes de l'app (feed, sondages, résultats) entrent de la même
 * façon : fade + translation verticale légère, décalée item par item. Passer
 * par ces fabriques évite que chaque écran réinvente ses propres durées.
 */

/** Entrée d'un item de liste, décalée selon sa position. */
export const enterListItem = (index: number) =>
  FadeInDown.delay(index * motion.stagger)
    .duration(motion.durations.base)
    .springify()
    .damping(motion.enter.damping)
    .stiffness(motion.enter.stiffness);

/** Entrée d'un bloc d'écran (en-tête, section), avec délai explicite. */
export const enterSection = (delayMs = 0) =>
  FadeInDown.delay(delayMs)
    .duration(motion.durations.slow)
    .springify()
    .damping(motion.enter.damping)
    .stiffness(motion.enter.stiffness);

/** Apparition simple, sans déplacement — badges, overlays, états vides. */
export const enterFade = (delayMs = 0) =>
  FadeIn.delay(delayMs).duration(motion.durations.base);

export const exitFade = () => FadeOut.duration(motion.durations.micro);

// ─── Surfaces modales ────────────────────────────────────────────────
/** Ressort commun aux surfaces modales : arrivée franche, fin posée. */
const SURFACE_SPRING = { damping: 22, stiffness: 210, mass: 0.85 } as const;

/**
 * Entrée d'une boîte de dialogue centrée.
 *
 * La carte monte de quelques pixels en s'ouvrant très légèrement, plutôt que
 * de grossir depuis le centre : un zoom pur donne l'impression que la surface
 * jaillit de nulle part, alors qu'une montée courte la fait *arriver* — c'est
 * le même mouvement que celui d'une feuille qu'on pose.
 *
 * L'opacité termine plus tôt que la position : la carte est déjà lisible
 * pendant que le ressort finit de se stabiliser.
 */
export const enterDialog = (): EntryExitAnimationFunction => () => {
  'worklet';
  return {
    initialValues: {
      opacity: 0,
      transform: [{ translateY: 26 }, { scale: 0.96 }],
    },
    animations: {
      opacity: withTiming(1, {
        duration: motion.durations.micro,
        easing: Easing.out(Easing.quad),
      }),
      transform: [
        { translateY: withSpring(0, SURFACE_SPRING) },
        { scale: withSpring(1, SURFACE_SPRING) },
      ],
    },
  };
};

/** Sortie d'une boîte de dialogue : retrait bref vers le bas. */
export const exitDialog = (): EntryExitAnimationFunction => () => {
  'worklet';
  return {
    initialValues: {
      opacity: 1,
      transform: [{ translateY: 0 }, { scale: 1 }],
    },
    animations: {
      opacity: withTiming(0, { duration: motion.durations.micro }),
      transform: [
        { translateY: withTiming(14, { duration: motion.durations.micro }) },
        { scale: withTiming(0.97, { duration: motion.durations.micro }) },
      ],
    },
  };
};

/**
 * Entrée d'une feuille depuis le bas (bottom sheets).
 *
 * La feuille part de sa propre hauteur — mesurée, pas devinée — donc elle
 * démarre exactement hors écran quel que soit son contenu, et le voile se
 * révèle en même temps qu'elle monte.
 */
export const enterSheet = (): EntryExitAnimationFunction =>
  ((values: EntryAnimationsValues) => {
    'worklet';
    return {
      initialValues: {
        opacity: 0,
        transform: [{ translateY: values.targetHeight }],
      },
      animations: {
        opacity: withTiming(1, { duration: motion.durations.micro }),
        transform: [{ translateY: withSpring(0, SURFACE_SPRING) }],
      },
    };
  }) as EntryExitAnimationFunction;
