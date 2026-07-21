import React from 'react';
import {
  StyleSheet,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { borderRadius, spacing, typography, motion } from '../../../constants/theme';
import { PressableScale, HapticStrength } from '../PressableScale';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  /** Icône affichée à côté du libellé. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Place l'icône après le libellé (flèche « Suivant », par exemple). */
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  /** Intensité du retour haptique. `none` pour les actions à faible enjeu. */
  haptic?: HapticStrength;
  /** @deprecated Utiliser `haptic`. Conservé pour les appels existants. */
  hapticFeedback?: boolean;
}

const SIZES: Record<ButtonSize, { height: number; font: number; icon: number; padding: number }> = {
  sm: { height: 40, font: typography.sizes.bodySmall, icon: 16, padding: spacing.lg },
  md: { height: 52, font: typography.sizes.body, icon: 18, padding: spacing.xl },
  lg: { height: 58, font: typography.sizes.body, icon: 20, padding: spacing.xl },
};

/**
 * Bouton de l'app.
 *
 * Le feedback de pression vient de `PressableScale` (UI thread). Pendant le
 * chargement, le bouton respire au lieu de sauter vers un spinner statique —
 * la hauteur reste stable, seul l'intérieur change.
 */
export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  accessibilityLabel,
  haptic,
  hapticFeedback = true,
}) => {
  const { colors, getFontSize, currentHitSlop } = useAccessibility();
  const dims = SIZES[size];
  const isInactive = disabled || loading;

  const pulse = useSharedValue(0);
  React.useEffect(() => {
    if (loading) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(0, { duration: motion.durations.micro });
    }
  }, [loading, pulse]);

  const loadingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [1, 0.72]),
  }));

  const surface = ((): ViewStyle => {
    if (disabled) {
      return {
        backgroundColor:
          variant === 'outline' || variant === 'ghost' ? 'transparent' : colors.border,
        borderWidth: variant === 'outline' ? 1.5 : 0,
        borderColor: colors.border,
      };
    }
    switch (variant) {
      case 'secondary':
        return { backgroundColor: colors.secondary, shadowColor: colors.secondary };
      case 'danger':
        return { backgroundColor: colors.error, shadowColor: colors.error };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'primary':
      default:
        return { backgroundColor: colors.primary, shadowColor: colors.primary };
    }
  })();

  const contentColor = ((): string => {
    if (disabled) return colors.textTertiary;
    switch (variant) {
      case 'outline':
      case 'ghost':
        return colors.primary;
      case 'secondary':
        // Le doré est trop clair pour du blanc — texte sombre pour le contraste AA.
        return colors.textPrimary;
      default:
        return colors.textInverse;
    }
  })();

  // Les variantes plates ne portent pas d'ombre : sans surface pleine, elle
  // dessinerait un halo flottant sur le fond crème.
  const hasShadow =
    !isInactive && (variant === 'primary' || variant === 'secondary' || variant === 'danger');

  const resolvedHaptic: HapticStrength = haptic ?? (hapticFeedback ? 'light' : 'none');

  const iconNode = icon ? <Ionicons name={icon} size={dims.icon} color={contentColor} /> : null;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isInactive}
      haptic={resolvedHaptic}
      scaleTo={motion.scale.button}
      hitSlop={currentHitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={[
        styles.button,
        { height: dims.height, paddingHorizontal: dims.padding },
        surface,
        hasShadow && styles.shadow,
        style,
      ]}
    >
      <Animated.View style={[styles.content, loadingStyle]}>
        {loading ? (
          <ActivityIndicator size="small" color={contentColor} />
        ) : (
          <>
            {iconPosition === 'left' && iconNode}
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: contentColor,
                  fontSize: getFontSize(dims.font),
                  fontFamily: typography.families.bodySemiBold,
                },
                textStyle,
              ]}
            >
              {label}
            </Text>
            {iconPosition === 'right' && iconNode}
          </>
        )}
      </Animated.View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadow: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default Button;
