import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Screen, TAB_BAR_CLEARANCE } from '../../components/ui/Screen';
import { enterSection } from '../../components/ui/motion';
import {
  spacing,
  typography,
  borderRadius,
  thematicGradients,
  withAlpha,
} from '../../constants/theme';

/**
 * Écran de l'assistant IA.
 *
 * Le module 4 (lutte contre la désinformation par IA) est en réétude et hors
 * périmètre V1 : cet écran annonce l'état d'avancement plutôt que de laisser
 * croire à une fonctionnalité disponible.
 */
export default function AIScreen() {
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const insets = useSafeAreaInsets();

  const orbit = useSharedValue(0);

  React.useEffect(() => {
    orbit.value = withRepeat(
      withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [orbit]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(orbit.value, [0, 1], [0.18, 0.4]),
    transform: [{ scale: interpolate(orbit.value, [0, 1], [1, 1.18]) }],
  }));

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(orbit.value, [0, 1], [-6, 6]) },
      { scale: interpolate(orbit.value, [0, 1], [0.98, 1.02]) },
    ],
  }));

  return (
    <Screen>
      <View style={[styles.container, { paddingBottom: TAB_BAR_CLEARANCE + insets.bottom }]}>
        <Animated.View entering={enterSection(0)} style={styles.orbWrapper}>
          <Animated.View
            style={[styles.halo, { backgroundColor: colors.primary }, haloStyle]}
            pointerEvents="none"
          />
          <Animated.View style={orbStyle}>
            <LinearGradient
              colors={thematicGradients.brand}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.orb}
            >
              <MaterialCommunityIcons name="creation" size={46} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={enterSection(120)} style={styles.texts}>
          <View style={[styles.badge, { backgroundColor: withAlpha(colors.secondary, 0.16) }]}>
            <Ionicons name="construct-outline" size={13} color={colors.secondary} />
            <Text
              style={{
                color: colors.secondary,
                fontSize: getFontSize(typography.sizes.micro),
                fontFamily: typography.families.bodyBold,
                letterSpacing: 0.6,
              }}
            >
              {t('ai.badge').toUpperCase()}
            </Text>
          </View>

          <Text
            style={[
              styles.title,
              {
                color: colors.textPrimary,
                fontSize: getFontSize(typography.sizes.h2),
                fontFamily: typography.families.heading,
              },
            ]}
          >
            {t('ai.title')}
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
                fontSize: getFontSize(typography.sizes.body),
                fontFamily: typography.families.body,
              },
            ]}
          >
            {t('ai.subtitle')}
          </Text>
        </Animated.View>

        <Animated.View
          entering={enterSection(200)}
          style={[styles.notice, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="information-circle-outline" size={19} color={colors.info} />
          <Text
            style={{
              flex: 1,
              color: colors.textSecondary,
              fontSize: getFontSize(typography.sizes.caption),
              fontFamily: typography.families.body,
              lineHeight: 18,
            }}
          >
            {t('ai.notice')}
          </Text>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.xxl,
  },
  orbWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  halo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: borderRadius.full,
  },
  orb: {
    width: 108,
    height: 108,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  texts: {
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 23,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
});
