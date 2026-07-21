import React, { useCallback } from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { motion } from '../../../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type HapticStrength = 'none' | 'light' | 'medium' | 'heavy' | 'success' | 'warning';

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  /** Échelle atteinte au toucher. Par défaut : échelle « bouton ». */
  scaleTo?: number;
  /** Intensité du retour haptique déclenché au press. */
  haptic?: HapticStrength;
  style?: StyleProp<ViewStyle>;
  /** Opacité appliquée en plus du scale — utile sur les icônes nues. */
  dimOnPress?: boolean;
}

const triggerHaptic = (strength: HapticStrength) => {
  switch (strength) {
    case 'light':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    case 'medium':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    case 'heavy':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    case 'success':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    case 'warning':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    default:
      return undefined;
  }
};

/**
 * Surface pressable avec feedback de scale sur le UI thread.
 *
 * Tout élément interactif de l'app passe par ce composant : c'est ce qui rend
 * le toucher uniformément « vivant » et évite les `opacity: 0.9` figés que
 * produit un `Pressable` nu.
 */
export const PressableScale: React.FC<PressableScaleProps> = ({
  children,
  scaleTo = motion.scale.button,
  haptic = 'light',
  style,
  dimOnPress = false,
  disabled,
  onPress,
  ...rest
}) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(1 - pressed.value * (1 - scaleTo), motion.press) },
    ],
    opacity: dimOnPress ? withSpring(1 - pressed.value * 0.35, motion.press) : 1,
  }));

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    pressed.value = 1;
  }, [disabled, pressed]);

  const handlePressOut = useCallback(() => {
    pressed.value = 0;
  }, [pressed]);

  const handlePress = useCallback(
    (event: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
      if (disabled) return;
      if (haptic !== 'none') void triggerHaptic(haptic);
      onPress?.(event);
    },
    [disabled, haptic, onPress]
  );

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};

export default PressableScale;
