import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { borderRadius, withAlpha } from '../../../constants/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height: number;
  /** Rayon des coins. Par défaut : rayon « carte ». */
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

const SWEEP_DURATION = 1150;

/**
 * Bloc de chargement avec balayage lumineux.
 *
 * Un reflet traverse la surface de gauche à droite, au lieu du clignotement
 * d'opacité qui donnait l'impression d'un élément défectueux plutôt que d'un
 * contenu en cours d'arrivée.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height,
  radius = borderRadius.lg,
  style,
}) => {
  const { colors, isDark } = useAccessibility();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: SWEEP_DURATION, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [progress]);

  const sweepStyle = useAnimatedStyle(() => ({
    // Le reflet fait deux largeurs de course pour ménager une pause entre
    // deux passages, plutôt qu'un défilement continu et nerveux.
    transform: [{ translateX: `${-100 + progress.value * 200}%` }],
  }));

  const base = isDark ? colors.surfaceElevated : colors.borderLight;
  const highlight = isDark ? withAlpha('#FFFFFF', 0.07) : withAlpha('#FFFFFF', 0.85);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Chargement du contenu"
      style={[
        styles.container,
        { width, height, borderRadius: radius, backgroundColor: base },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, sweepStyle]}>
        <LinearGradient
          colors={['transparent', highlight, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default Skeleton;
