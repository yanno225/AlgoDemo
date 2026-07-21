import React from 'react';
import { StyleSheet, View, Text, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useAccessibility } from '../../../../hooks/useAccessibility';
import { spacing, typography, borderRadius, withAlpha } from '../../../../constants/theme';

export type StatusTone = 'open' | 'closed' | 'progress' | 'resolved';

export interface StatusPillProps {
  label: string;
  tone: StatusTone;
  /** Fait pulser la pastille — réservé aux états réellement en cours. */
  pulse?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pastille d'état d'un contenu participatif.
 *
 * La couleur porte le sens, le point coloré le renforce : les états ne
 * reposent jamais sur la seule couleur, condition d'accessibilité pour les
 * utilisateurs daltoniens.
 */
export const StatusPill: React.FC<StatusPillProps> = ({ label, tone, pulse = false, style }) => {
  const { colors, getFontSize } = useAccessibility();

  const toneColor = {
    open: colors.success,
    closed: colors.textTertiary,
    progress: colors.secondary,
    resolved: colors.success,
  }[tone];

  const beat = useSharedValue(0);

  React.useEffect(() => {
    if (!pulse) return;
    beat.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [pulse, beat]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse ? interpolate(beat.value, [0, 1], [1, 1.35]) : 1 }],
    opacity: pulse ? interpolate(beat.value, [0, 1], [1, 0.55]) : 1,
  }));

  return (
    <View style={[styles.pill, { backgroundColor: withAlpha(toneColor, 0.14) }, style]}>
      <Animated.View style={[styles.dot, { backgroundColor: toneColor }, dotStyle]} />
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: toneColor,
            fontSize: getFontSize(typography.sizes.micro),
            fontFamily: typography.families.bodyBold,
          },
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    letterSpacing: 0.6,
  },
});

export default StatusPill;
