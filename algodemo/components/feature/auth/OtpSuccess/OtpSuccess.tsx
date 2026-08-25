import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { useAccessibility } from '../../../../hooks/useAccessibility';
import { spacing, typography, borderRadius, motion, withAlpha } from '../../../../constants/theme';

interface OtpSuccessProps {
  /** Message sous la coche (« C'est vous ! Connexion en cours… »). */
  label: string;
}

const CIRCLE_SIZE = 104;

/**
 * Confirmation animée du code vérifié.
 *
 * Trois temps, comme un soupir de soulagement : le cercle vert éclot d'un
 * ressort, la coche y surgit une fraction de seconde après, et une onde
 * s'échappe en s'évanouissant — pendant que la session s'ouvre en coulisses.
 */
export const OtpSuccess: React.FC<OtpSuccessProps> = ({ label }) => {
  const { colors, getFontSize } = useAccessibility();

  const circle = useSharedValue(0);
  const check = useSharedValue(0);
  const halo = useSharedValue(0);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    circle.value = withSpring(1, motion.bounce);
    check.value = withDelay(160, withSpring(1, motion.bounce));
    halo.value = withDelay(
      120,
      withTiming(1, { duration: 750, easing: Easing.out(Easing.quad) })
    );
  }, [circle, check, halo]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circle.value }],
    opacity: circle.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: check.value }],
    opacity: check.value,
  }));

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + halo.value * 0.9 }],
    opacity: 0.45 * (1 - halo.value),
  }));

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.halo,
            { borderColor: withAlpha(colors.success, 0.9) },
            haloStyle,
          ]}
        />
        <Animated.View
          style={[styles.circle, { backgroundColor: colors.success }, circleStyle]}
        >
          <Animated.View style={checkStyle}>
            <Ionicons name="checkmark" size={52} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.Text
        entering={FadeInDown.delay(260).springify().damping(18)}
        style={{
          color: colors.textPrimary,
          fontSize: getFontSize(typography.sizes.body),
          fontFamily: typography.families.bodySemiBold,
          textAlign: 'center',
        }}
      >
        {label}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.huge,
  },
  stage: {
    width: CIRCLE_SIZE * 1.8,
    height: CIRCLE_SIZE * 1.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  halo: {
    position: 'absolute',
    width: CIRCLE_SIZE * 1.6,
    height: CIRCLE_SIZE * 1.6,
    borderRadius: borderRadius.full,
    borderWidth: 3,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OtpSuccess;
