import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Longueurs des tracés SVG (mesurées une fois — cercle r=26, coche). */
const CIRCONFERENCE = 2 * Math.PI * 26;
const LONGUEUR_COCHE = 38;

/**
 * Coche de confirmation qui SE DESSINE : le cercle se trace, puis le trait
 * de la coche, avec un léger rebond d'ensemble. À monter au moment où
 * l'action a réellement abouti (réponse du serveur) — jamais avant.
 */
export const SuccessCheck: React.FC<{ size?: number; color: string }> = ({
  size = 56,
  color,
}) => {
  const progress = useSharedValue(0);
  const pop = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(1, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
    pop.value = withDelay(80, withSpring(1, { damping: 12, stiffness: 180 }));
  }, [progress, pop]);

  const circleProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCONFERENCE * (1 - Math.min(progress.value * 1.6, 1)),
  }));

  // La coche ne démarre qu'aux deux tiers du cercle — enchaînement lisible.
  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset:
      LONGUEUR_COCHE *
      (1 - interpolate(progress.value, [0.55, 1], [0, 1], 'clamp')),
  }));

  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pop.value, [0, 1], [0.7, 1]) }],
    opacity: interpolate(pop.value, [0, 0.4, 1], [0, 1, 1]),
  }));

  return (
    <Animated.View style={[styles.wrap, popStyle]}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 60 60">
          <AnimatedCircle
            cx={30}
            cy={30}
            r={26}
            stroke={color}
            strokeWidth={4}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={CIRCONFERENCE}
            transform="rotate(-90 30 30)"
            animatedProps={circleProps}
          />
          <AnimatedPath
            d="M18 31 L26.5 39.5 L42.5 22.5"
            stroke={color}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="transparent"
            strokeDasharray={LONGUEUR_COCHE}
            animatedProps={checkProps}
          />
        </Svg>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SuccessCheck;
