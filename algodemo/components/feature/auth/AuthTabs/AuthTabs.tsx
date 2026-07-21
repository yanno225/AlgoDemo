import React, { useState } from 'react';
import { StyleSheet, View, Text, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../../../../hooks/useAccessibility';
import { spacing, typography, borderRadius, motion, shadows } from '../../../../constants/theme';
import { PressableScale } from '../../../ui/PressableScale';

export type AuthTabKey = 'login' | 'register';

export interface AuthTabsProps {
  active: AuthTabKey;
  onChange: (tab: AuthTabKey) => void;
}

const TABS: AuthTabKey[] = ['login', 'register'];

/**
 * Bascule entre connexion et inscription.
 *
 * Le fond de l'onglet actif glisse vers sa nouvelle position au lieu de
 * changer de couleur d'un coup — c'est ce déplacement qui relie visuellement
 * les deux écrans et évite l'impression de saut.
 */
export const AuthTabs: React.FC<AuthTabsProps> = ({ active, onChange }) => {
  const { colors, getFontSize } = useAccessibility();
  const { t } = useTranslation();

  const [trackWidth, setTrackWidth] = useState(0);
  const activeIndex = TABS.indexOf(active);
  const position = useSharedValue(activeIndex);

  React.useEffect(() => {
    position.value = withSpring(activeIndex, motion.slide);
  }, [activeIndex, position]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  // Largeur d'un onglet, marges intérieures du rail déduites.
  const segmentWidth = trackWidth > 0 ? (trackWidth - spacing.xs * 2) / TABS.length : 0;

  const indicatorStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: position.value * segmentWidth }],
  }));

  return (
    <View
      onLayout={handleLayout}
      style={[styles.track, { backgroundColor: colors.surfaceElevated }]}
      accessibilityRole="tablist"
    >
      {segmentWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            { backgroundColor: colors.surface },
            shadows.sm,
            indicatorStyle,
          ]}
        />
      )}

      {TABS.map((tab) => (
        <TabLabel
          key={tab}
          label={t(`auth.tabs.${tab}`)}
          isActive={tab === active}
          onPress={() => onChange(tab)}
          activeColor={colors.primary}
          restingColor={colors.textSecondary}
          fontSize={getFontSize(typography.sizes.bodySmall)}
        />
      ))}
    </View>
  );
};

const TabLabel: React.FC<{
  label: string;
  isActive: boolean;
  onPress: () => void;
  activeColor: string;
  restingColor: string;
  fontSize: number;
}> = ({ label, isActive, onPress, activeColor, restingColor, fontSize }) => {
  const progress = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, { duration: motion.durations.base });
  }, [isActive, progress]);

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [restingColor, activeColor]),
  }));

  return (
    <PressableScale
      onPress={onPress}
      disabled={isActive}
      scaleTo={motion.scale.chip}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
      style={styles.tab}
    >
      <Animated.Text
        numberOfLines={1}
        style={[
          styles.tabLabel,
          {
            fontSize,
            fontFamily: isActive
              ? typography.families.bodyBold
              : typography.families.bodyMedium,
          },
          textStyle,
        ]}
      >
        {label}
      </Animated.Text>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xxl,
  },
  indicator: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    bottom: spacing.xs,
    borderRadius: borderRadius.sm + 2,
  },
  tab: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    textAlign: 'center',
  },
});

export default AuthTabs;
