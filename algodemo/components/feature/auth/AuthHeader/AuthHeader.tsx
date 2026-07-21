import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../../../../hooks/useAccessibility';
import { spacing, typography, borderRadius, motion } from '../../../../constants/theme';
import { PressableScale } from '../../../ui/PressableScale';

export interface AuthHeaderProps {
  /** Sous-titre affiché sous le nom de l'app. Par défaut : signature de marque. */
  subtitle?: string;
  /** Affiche une flèche de retour, alignée à gauche au-dessus du logo. */
  onBack?: () => void;
}

/**
 * En-tête de marque des écrans d'authentification.
 *
 * Logo centré au-dessus du formulaire, conformément à la maquette. Le bloc
 * entre en deux temps — la marque d'abord, le texte ensuite — pour que le
 * regard se pose sur le logo avant de lire.
 */
export const AuthHeader: React.FC<AuthHeaderProps> = ({ subtitle, onBack }) => {
  const { colors, getFontSize } = useAccessibility();
  const { t } = useTranslation();

  const reveal = useSharedValue(0);

  React.useEffect(() => {
    reveal.value = withDelay(60, withSpring(1, motion.enter));
  }, [reveal]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [
      { scale: interpolate(reveal.value, [0, 1], [0.72, 1]) },
      { translateY: interpolate(reveal.value, [0, 1], [14, 0]) },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: withDelay(110, withTiming(reveal.value, { duration: motion.durations.slow })),
    transform: [{ translateY: interpolate(reveal.value, [0, 1], [10, 0]) }],
  }));

  return (
    <View style={styles.container}>
      {onBack && (
        <PressableScale
          onPress={onBack}
          scaleTo={motion.scale.chip}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textPrimary} />
        </PressableScale>
      )}

      <Animated.View
        style={[
          styles.mark,
          { backgroundColor: colors.primary, shadowColor: colors.primary },
          markStyle,
        ]}
      >
        <MaterialCommunityIcons name="scale-balance" size={34} color={colors.textInverse} />
      </Animated.View>

      <Animated.View style={[styles.texts, textStyle]}>
        <Text
          style={[
            styles.brand,
            {
              color: colors.primary,
              fontSize: getFontSize(typography.sizes.h2),
              fontFamily: typography.families.heading,
            },
          ]}
        >
          {t('auth.brand.name')}
        </Text>
        <Text
          style={[
            styles.tagline,
            {
              color: colors.textSecondary,
              fontSize: getFontSize(typography.sizes.bodySmall),
              fontFamily: typography.families.body,
            },
          ]}
        >
          {subtitle ?? t('auth.brand.tagline')}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: spacing.md,
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  mark: {
    width: 68,
    height: 68,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.24,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  texts: {
    alignItems: 'center',
  },
  brand: {
    marginBottom: spacing.xs,
  },
  tagline: {
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AuthHeader;
