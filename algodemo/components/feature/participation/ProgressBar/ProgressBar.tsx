import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAccessibility } from '../../../../hooks/useAccessibility';
import {
  spacing,
  typography,
  borderRadius,
  motion,
  withAlpha,
} from '../../../../constants/theme';

export interface ProgressBarProps {
  /** Valeur de 0 à 100. */
  value: number;
  label: string;
  color?: string;
  /** Retarde le remplissage — permet de décaler plusieurs jauges d'une liste. */
  delay?: number;
}

/**
 * Jauge de progression d'une consultation.
 *
 * Le remplissage part de zéro à l'ouverture de l'écran : afficher directement
 * la valeur finale prive l'utilisateur de la perception de l'avancement.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({ value, label, color, delay = 0 }) => {
  const { colors, getFontSize } = useAccessibility();
  const tint = color ?? colors.primary;

  const progress = useSharedValue(0);
  const clamped = Math.max(0, Math.min(100, value));

  React.useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(clamped, {
        duration: motion.durations.gauge,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [clamped, delay, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      accessibilityLabel={label}
    >
      <View style={styles.row}>
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            {
              color: colors.textSecondary,
              fontSize: getFontSize(typography.sizes.caption),
              fontFamily: typography.families.bodyMedium,
            },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            {
              color: tint,
              fontSize: getFontSize(typography.sizes.bodySmall),
              fontFamily: typography.families.bodyBold,
            },
          ]}
        >
          {clamped}%
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: withAlpha(tint, 0.12) }]}>
        <Animated.View style={[styles.fill, { backgroundColor: tint }, fillStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    flexShrink: 1,
  },
  track: {
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});

export default ProgressBar;
