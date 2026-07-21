import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
  useSharedValue,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../../../../hooks/useAccessibility';
import { spacing, typography, borderRadius, motion } from '../../../../constants/theme';

export interface PasswordStrengthProps {
  password: string;
}

const SEGMENTS = 3;

/**
 * Évalue la robustesse d'un mot de passe.
 *
 * Volontairement simple et local : le but est de guider la saisie, pas de
 * remplacer la politique de mot de passe appliquée côté serveur.
 *
 * @returns 0 (vide) à 3 (robuste)
 */
export const getPasswordScore = (password: string): number => {
  if (!password) return 0;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  // Un mot de passe court reste faible même s'il mélange les familles.
  if (password.length < 8) return Math.min(score, 1);

  return Math.min(score, SEGMENTS);
};

/**
 * Jauge de robustesse du mot de passe, affichée sous le champ de saisie.
 */
export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const { colors, getFontSize } = useAccessibility();
  const { t } = useTranslation();

  const score = getPasswordScore(password);

  const tone =
    score >= 3 ? colors.success : score === 2 ? colors.warning : colors.error;
  const label =
    score >= 3
      ? t('auth.register.passwordStrength.strong')
      : score === 2
        ? t('auth.register.passwordStrength.medium')
        : t('auth.register.passwordStrength.weak');

  if (!password) return null;

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <View style={styles.bars}>
        {Array.from({ length: SEGMENTS }).map((_, index) => (
          <Segment
            key={index}
            active={index < score}
            tone={tone}
            restingColor={colors.borderLight}
            delay={index * 60}
          />
        ))}
      </View>
      <Text
        style={[
          styles.label,
          {
            color: tone,
            fontSize: getFontSize(typography.sizes.caption),
            fontFamily: typography.families.bodySemiBold,
          },
        ]}
      >
        {t('auth.register.passwordStrength.label')} : {label}
      </Text>
    </View>
  );
};

const Segment: React.FC<{
  active: boolean;
  tone: string;
  restingColor: string;
  delay: number;
}> = ({ active, tone, restingColor, delay }) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: motion.durations.base });
  }, [active, progress]);

  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [restingColor, tone]),
    transform: [{ scaleY: withSpring(0.6 + progress.value * 0.4, motion.slide) }],
  }));

  return <Animated.View style={[styles.segment, style]} />;
};

const styles = StyleSheet.create({
  container: {
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  bars: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: borderRadius.full,
  },
  label: {
    marginLeft: spacing.xs,
  },
});

export default PasswordStrength;
