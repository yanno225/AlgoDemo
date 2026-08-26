import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
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

const CENTER_ROUTE = 'pays';
const BAR_HEIGHT = 62;

/**
 * Barre de navigation flottante en verre dépoli.
 *
 * Elle flotte au-dessus du contenu plutôt que de l'ancrer : c'est ce qui
 * permet au fil immersif d'occuper réellement tout l'écran. L'onglet actif
 * s'étire en pilule pleine qui révèle son nom ; les autres se replient en
 * icône seule — le libellé n'est affiché que là où il est utile.
 */
export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark, getFontSize } = useAccessibility();
  const insets = useSafeAreaInsets();

  const theme = isDark ? glass.dark : glass.light;

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

        <View style={styles.track}>
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

/**
 * Onglet « pilule extensible » : au repos, une icône seule ; actif, l'onglet
 * gagne de la place (flex animé), une pilule pleine se remplit sous l'icône
 * et le libellé se déplie à sa droite (maxWidth + opacité). Tout est piloté
 * par un unique ressort `progress`, pour que largeur, couleur et texte
 * arrivent exactement ensemble.
 */
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

  // L'onglet actif s'élargit pendant que ses voisins se resserrent : c'est
  // ce transfert de place qui donne l'impression que la pilule « s'étire ».
  const slotStyle = useAnimatedStyle(() => ({
    flex: 1 + progress.value,
  }));

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', activeColor]
    ),
  }));

  const labelWrapStyle = useAnimatedStyle(() => ({
    // Le texte ne commence à apparaître qu'une fois la pilule bien formée,
    // et se replie en premier au départ — jamais de libellé orphelin.
    opacity: interpolate(progress.value, [0.35, 1], [0, 1], 'clamp'),
    maxWidth: interpolate(progress.value, [0, 1], [0, 104]),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-8, 0]) }],
  }));

  const iconName = isFocused ? config.icon.focused : config.icon.default;
  // Sur la pilule pleine, le contenu passe en blanc pour le contraste.
  const iconColor = isFocused ? '#FFFFFF' : inactiveColor;

  return (
    <Animated.View style={[styles.tabSlot, slotStyle]}>
      <PressableScale
        onPress={onPress}
        scaleTo={motion.scale.chip}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={accessibilityLabel}
        style={styles.tabItem}
      >
        <Animated.View style={[styles.pill, pillStyle]}>
          {config.type === 'material' ? (
            <MaterialCommunityIcons name={iconName as any} size={22} color={iconColor} />
          ) : (
            <Ionicons name={iconName as any} size={22} color={iconColor} />
          )}
          <Animated.View style={labelWrapStyle}>
            <Animated.Text
              numberOfLines={1}
              style={[
                styles.tabLabel,
                {
                  fontSize,
                  color: '#FFFFFF',
                  fontFamily: typography.families.bodySemiBold,
                },
              ]}
            >
              {config.label}
            </Animated.Text>
          </Animated.View>
        </Animated.View>
      </PressableScale>
    </Animated.View>
  );
};

// ─── Bouton central « Fiche pays » ──────────────────────────────────
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
          accessibilityLabel="Fiche pays"
          style={[styles.centerButton, { shadowColor: colors.primary }]}
        >
          <LinearGradient
            colors={thematicGradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerGradient}
          >
            <MaterialCommunityIcons name="map-marker-radius" size={26} color="#FFFFFF" />
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
  tabSlot: {
    height: '100%',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    gap: 6,
    overflow: 'hidden',
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
