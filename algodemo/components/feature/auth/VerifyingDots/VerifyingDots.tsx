import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAccessibility } from '../../../../hooks/useAccessibility';
import { spacing, typography, borderRadius } from '../../../../constants/theme';

interface VerifyingDotsProps {
  /** Texte sous les points (« Vérification… », « Envoi du code… »). */
  label: string;
}

const DOT_COUNT = 5;
const BOUNCE_HEIGHT = -7;
const BOUNCE_DURATION = 320;
/** Décalage entre deux points : c'est lui qui crée la vague. */
const STAGGER = 90;

/**
 * Attente animée : cinq points aux couleurs des cinq thématiques FID qui
 * dansent en vague. L'attente raconte la marque au lieu d'un spinner
 * générique — et la boucle tourne sur le thread UI, jamais saccadée.
 */
export const VerifyingDots: React.FC<VerifyingDotsProps> = ({ label }) => {
  const { colors, getFontSize } = useAccessibility();

  const palette = [
    colors.thematic.genreSociete,
    colors.thematic.jeunesseSociete,
    colors.thematic.droit,
    colors.thematic.politique,
    colors.thematic.societeVivant,
  ];

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <View style={styles.dots}>
        {palette.map((color, index) => (
          <Dot key={index} color={color} delay={index * STAGGER} />
        ))}
      </View>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: getFontSize(typography.sizes.bodySmall),
          fontFamily: typography.families.bodyMedium,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const Dot: React.FC<{ color: string; delay: number }> = ({ color, delay }) => {
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: BOUNCE_DURATION,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(0, {
            duration: BOUNCE_DURATION,
            easing: Easing.in(Easing.quad),
          }),
          // Temps mort en bas : la vague repart de la gauche, pas en continu.
          withTiming(0, { duration: STAGGER * 4 })
        ),
        -1,
        false
      )
    );
    return () => {
      bounce.value = 0;
    };
  }, [bounce, delay]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounce.value * BOUNCE_HEIGHT },
      { scale: 1 + bounce.value * 0.15 },
    ],
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    height: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
  },
});

export default VerifyingDots;
