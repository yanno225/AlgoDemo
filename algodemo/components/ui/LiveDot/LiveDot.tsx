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
import { useAccessibility } from '../../../hooks/useAccessibility';
import { spacing, typography, borderRadius, withAlpha } from '../../../constants/theme';

export interface LiveDotProps {
  label: string;
  /** `solid` : sur fond clair. `overlay` : posé sur un média sombre. */
  variant?: 'solid' | 'overlay';
  style?: StyleProp<ViewStyle>;
}

/**
 * Indicateur « en direct ».
 *
 * Le point pulse en continu, doublé d'un halo qui se dilate : c'est le signal
 * qui distingue un contenu vivant d'un replay, et il ne repose pas sur la
 * seule couleur rouge.
 */
export const LiveDot: React.FC<LiveDotProps> = ({ label, variant = 'solid', style }) => {
  const { colors, getFontSize } = useAccessibility();
  const beat = useSharedValue(0);

  React.useEffect(() => {
    beat.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [beat]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(beat.value, [0, 1], [1, 1.18]) }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(beat.value, [0, 1], [0.5, 0]),
    transform: [{ scale: interpolate(beat.value, [0, 1], [1, 2.6]) }],
  }));

  const isOverlay = variant === 'overlay';
  const background = isOverlay ? withAlpha('#000000', 0.55) : withAlpha(colors.live, 0.12);
  const textColor = isOverlay ? '#FFFFFF' : colors.live;

  return (
    <View style={[styles.container, { backgroundColor: background }, style]}>
      <View style={styles.dotWrapper}>
        <Animated.View style={[styles.halo, { backgroundColor: colors.live }, haloStyle]} />
        <Animated.View style={[styles.dot, { backgroundColor: colors.live }, dotStyle]} />
      </View>
      <Text
        style={[
          styles.label,
          {
            color: textColor,
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
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  dotWrapper: {
    width: 7,
    height: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  halo: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  label: {
    letterSpacing: 0.8,
  },
});

export default LiveDot;
