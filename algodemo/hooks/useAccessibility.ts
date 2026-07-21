import { useAccessibilityStore } from '../stores/accessibilityStore';
import { lightColors, darkColors, hitSlop } from '../constants/theme';
import { useColorScheme } from 'react-native';

export const useAccessibility = () => {
  const systemScheme = useColorScheme();
  const {
    fontScaleMultiplier,
    highContrast,
    autoReadTTS,
    increaseHitSlops,
    setFontScaleMultiplier,
    toggleHighContrast,
    toggleAutoReadTTS,
    toggleIncreaseHitSlops,
  } = useAccessibilityStore();

  // Détermination du thème
  const isDark = systemScheme === 'dark';
  const rawColors = isDark ? darkColors : lightColors;

  // Si le contraste élevé est activé, on surcharge certaines couleurs pour le WCAG AAA
  const colors = {
    ...rawColors,
    ...(highContrast ? {
      background: isDark ? '#000000' : '#FFFFFF',
      surface: isDark ? '#121212' : '#FFFFFF',
      textPrimary: isDark ? '#FFFFFF' : '#000000',
      textSecondary: isDark ? '#E0E0E0' : '#333333',
      border: isDark ? '#FFFFFF' : '#000000',
      primary: isDark ? '#82E06A' : '#1D3B13', // Version contrastée
    } : {}),
  };

  // Helper pour calculer une taille de police accessible
  const getFontSize = (baseSize: number) => {
    return baseSize * fontScaleMultiplier;
  };

  // HitSlop adapté selon les préférences d'accessibilité
  const currentHitSlop = increaseHitSlops ? hitSlop.large : hitSlop.default;

  return {
    colors,
    isDark,
    fontScaleMultiplier,
    highContrast,
    autoReadTTS,
    increaseHitSlops,
    getFontSize,
    currentHitSlop,
    setFontScaleMultiplier,
    toggleHighContrast,
    toggleAutoReadTTS,
    toggleIncreaseHitSlops,
  };
};
