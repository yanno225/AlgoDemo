import React, { useState } from 'react';
import { StyleSheet, View, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { useAccessibility } from '../../../../hooks/useAccessibility';
import { spacing, typography, borderRadius, motion, shadows } from '../../../../constants/theme';
import { PressableScale } from '../../../ui/PressableScale';

/**
 * Barre d'onglets du module Participation.
 *
 * Le fond de l'onglet actif glisse vers sa nouvelle position et suit le
 * balayage horizontal, au lieu du simple soulignement qui changeait de place
 * après coup — l'indicateur reste ainsi solidaire du geste.
 */
export const ParticipationTabBar: React.FC<MaterialTopTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { colors, getFontSize } = useAccessibility();
  const [trackWidth, setTrackWidth] = useState(0);

  const position = useSharedValue(state.index);

  React.useEffect(() => {
    position.value = withSpring(state.index, motion.slide);
  }, [state.index, position]);

  const segmentWidth = trackWidth > 0 ? (trackWidth - spacing.xs * 2) / state.routes.length : 0;

  const indicatorStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: position.value * segmentWidth }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width);

  return (
    <View
      onLayout={handleLayout}
      style={[styles.track, { backgroundColor: colors.surfaceElevated }]}
      accessibilityRole="tablist"
    >
      {segmentWidth > 0 && (
        <Animated.View
          style={[styles.indicator, { backgroundColor: colors.surface }, shadows.sm, indicatorStyle]}
          pointerEvents="none"
        />
      )}

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = (options.title ?? route.name) as string;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabLabel
            key={route.key}
            label={label}
            isFocused={isFocused}
            onPress={onPress}
            activeColor={colors.primary}
            restingColor={colors.textSecondary}
            fontSize={getFontSize(typography.sizes.bodySmall)}
          />
        );
      })}
    </View>
  );
};

const TabLabel: React.FC<{
  label: string;
  isFocused: boolean;
  onPress: () => void;
  activeColor: string;
  restingColor: string;
  fontSize: number;
}> = ({ label, isFocused, onPress, activeColor, restingColor, fontSize }) => {
  const progress = useSharedValue(isFocused ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(isFocused ? 1 : 0, { duration: motion.durations.base });
  }, [isFocused, progress]);

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [restingColor, activeColor]),
  }));

  return (
    <PressableScale
      onPress={onPress}
      disabled={isFocused}
      scaleTo={motion.scale.chip}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      style={styles.tab}
    >
      <Animated.Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            fontSize,
            fontFamily: isFocused ? typography.families.bodyBold : typography.families.bodyMedium,
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
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
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
  label: {
    textAlign: 'center',
  },
});

export default ParticipationTabBar;
