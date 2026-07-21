import React, { useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAccessibility } from '../../hooks/useAccessibility';
import {
  spacing,
  typography,
  borderRadius,
  motion,
  glass,
  thematicGradients,
  withAlpha,
} from '../../constants/theme';
import { PressableScale } from '../ui/PressableScale';

const CENTER_ROUTE = 'ai';
const BAR_HEIGHT = 62;

/**
 * Barre de navigation flottante en verre dépoli.
 *
 * Elle flotte au-dessus du contenu plutôt que de l'ancrer : c'est ce qui
 * permet au fil immersif d'occuper réellement tout l'écran. L'indicateur de
 * l'onglet actif glisse d'une position à l'autre au lieu de sauter.
 */
export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark, getFontSize } = useAccessibility();
  const insets = useSafeAreaInsets();
  const [trackWidth, setTrackWidth] = useState(0);

  const theme = isDark ? glass.dark : glass.light;

  const segmentWidth = trackWidth > 0 ? trackWidth / state.routes.length : 0;

  const indicatorPosition = useSharedValue(state.index);

  React.useEffect(() => {
    indicatorPosition.value = withSpring(state.index, motion.slide);
  }, [state.index, indicatorPosition]);

  const activeRouteName = state.routes[state.index]?.name;
  const isCenterActive = activeRouteName === CENTER_ROUTE;

  const indicatorStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: indicatorPosition.value * segmentWidth }],
    // L'onglet central a son propre bouton en relief : l'indicateur
    // s'efface pour ne pas doubler le signal.
    opacity: withTiming(isCenterActive ? 0 : 1, { duration: motion.durations.micro }),
  }));

  const handleLayout = (event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width);

  const navigate = (routeKey: string, routeName: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
      pointerEvents="box-none"
    >
      <View style={[styles.bar, { shadowColor: colors.primary }]}>
        <BlurView
          intensity={theme.intensity}
          tint={theme.tint}
          style={StyleSheet.absoluteFill}
        />
        {/* Voile de repli : sur Android le flou seul manque d'opacité et le
            contenu défilant reste lisible sous les libellés. */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.overlay, borderColor: theme.hairline, borderWidth: 1 },
          ]}
        />

        <View style={styles.track} onLayout={handleLayout}>
          {segmentWidth > 0 && (
            <Animated.View style={[styles.indicatorSlot, indicatorStyle]} pointerEvents="none">
              <View
                style={[styles.indicator, { backgroundColor: withAlpha(colors.primary, 0.12) }]}
              />
            </Animated.View>
          )}

          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const { options } = descriptors[route.key];
            const onPress = () => navigate(route.key, route.name, isFocused);

            if (route.name === CENTER_ROUTE) {
              return <CenterButton key={route.key} isFocused={isFocused} onPress={onPress} />;
            }

            const config = getTabConfig(route.name);
            return (
              <TabItem
                key={route.key}
                config={config}
                isFocused={isFocused}
                onPress={onPress}
                activeColor={colors.tabActive}
                inactiveColor={colors.tabInactive}
                fontSize={getFontSize(typography.sizes.micro)}
                accessibilityLabel={options.title ?? config.label}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Onglet standard ────────────────────────────────────────────────
interface TabConfig {
  icon: { focused: string; default: string };
  type: 'ionicons' | 'material';
  label: string;
}

const TabItem: React.FC<{
  config: TabConfig;
  isFocused: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
  fontSize: number;
  accessibilityLabel: string;
}> = ({ config, isFocused, onPress, activeColor, inactiveColor, fontSize, accessibilityLabel }) => {
  const progress = useSharedValue(isFocused ? 1 : 0);

  React.useEffect(() => {
    progress.value = withSpring(isFocused ? 1 : 0, motion.slide);
  }, [isFocused, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [0, -2]) }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [inactiveColor, activeColor]),
  }));

  const color = isFocused ? activeColor : inactiveColor;
  const iconName = isFocused ? config.icon.focused : config.icon.default;

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={motion.scale.chip}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={accessibilityLabel}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.tabInner, iconStyle]}>
        {config.type === 'material' ? (
          <MaterialCommunityIcons name={iconName as any} size={22} color={color} />
        ) : (
          <Ionicons name={iconName as any} size={22} color={color} />
        )}
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.tabLabel,
            {
              fontSize,
              fontFamily: isFocused
                ? typography.families.bodySemiBold
                : typography.families.body,
            },
            labelStyle,
          ]}
        >
          {config.label}
        </Animated.Text>
      </Animated.View>
    </PressableScale>
  );
};

// ─── Bouton central « IA » ──────────────────────────────────────────
const CenterButton: React.FC<{ isFocused: boolean; onPress: () => void }> = ({
  isFocused,
  onPress,
}) => {
  const { colors } = useAccessibility();
  const halo = useSharedValue(0);

  React.useEffect(() => {
    // Respiration lente : signale un module vivant sans capter l'attention.
    halo.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200 }),
        withTiming(0, { duration: 2200 })
      ),
      -1,
      false
    );
  }, [halo]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(halo.value, [0, 1], [0.16, 0.34]),
    transform: [{ scale: interpolate(halo.value, [0, 1], [1, 1.14]) }],
  }));

  const focusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.06 : 1, motion.slide) }],
  }));

  return (
    <View style={styles.centerSlot} pointerEvents="box-none">
      <Animated.View
        style={[styles.centerHalo, { backgroundColor: colors.primary }, haloStyle]}
        pointerEvents="none"
      />
      <Animated.View style={focusStyle}>
        <PressableScale
          onPress={onPress}
          haptic="medium"
          scaleTo={0.9}
          accessibilityRole="tab"
          accessibilityState={{ selected: isFocused }}
          accessibilityLabel="Assistant IA"
          style={[styles.centerButton, { shadowColor: colors.primary }]}
        >
          <LinearGradient
            colors={thematicGradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerGradient}
          >
            <MaterialCommunityIcons name="creation" size={26} color="#FFFFFF" />
          </LinearGradient>
        </PressableScale>
      </Animated.View>
    </View>
  );
};

// ─── Configuration des onglets ──────────────────────────────────────
function getTabConfig(routeName: string): TabConfig {
  switch (routeName) {
    case 'feed':
      return { icon: { focused: 'home', default: 'home-outline' }, type: 'ionicons', label: 'Accueil' };
    case 'debats':
      return {
        icon: { focused: 'play-box', default: 'play-box-outline' },
        type: 'material',
        label: 'Lives',
      };
    case 'participation':
      return {
        icon: { focused: 'people', default: 'people-outline' },
        type: 'ionicons',
        label: 'Participer',
      };
    case 'profile':
      return {
        icon: { focused: 'person', default: 'person-outline' },
        type: 'ionicons',
        label: 'Profil',
      };
    default:
      return {
        icon: { focused: 'ellipse', default: 'ellipse-outline' },
        type: 'ionicons',
        label: routeName,
      };
  }
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 22,
      },
      android: { elevation: 12 },
    }),
  },
  track: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 52,
    height: 40,
    borderRadius: borderRadius.md,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    gap: 2,
  },
  tabLabel: {
    letterSpacing: 0.1,
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerHalo: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: borderRadius.full,
  },
  centerButton: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  centerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
