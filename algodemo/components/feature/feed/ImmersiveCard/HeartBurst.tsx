import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

/** Directions des éclats, en cercle autour du cœur. */
const PARTICULES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
  return { dx: Math.cos(angle), dy: Math.sin(angle), delai: (i % 3) * 40 };
});

/**
 * Éclat de cœur du double-tap : un grand cœur surgit avec un rebond puis
 * s'évapore vers le haut, pendant que huit éclats fusent en étoile.
 * Monté à la demande par le parent, il se démonte tout seul via `onDone`.
 */
export const HeartBurst: React.FC<{ color: string; onDone: () => void }> = ({
  color,
  onDone,
}) => {
  const vie = useSharedValue(0);

  React.useEffect(() => {
    vie.value = withSequence(
      withSpring(1, { damping: 11, stiffness: 210 }),
      withDelay(
        180,
        withTiming(
          2,
          { duration: 420, easing: Easing.in(Easing.cubic) },
          (fini) => {
            if (fini) runOnJS(onDone)();
          }
        )
      )
    );
    // Un éclat est un événement unique : il vit sa séquence puis disparaît.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const coeurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(vie.value, [0, 0.25, 1, 2], [0, 1, 1, 0]),
    transform: [
      { scale: interpolate(vie.value, [0, 1, 2], [0.4, 1, 1.25]) },
      { translateY: interpolate(vie.value, [1, 2], [0, -46], 'clamp') },
      { rotate: `${interpolate(vie.value, [0, 1], [-12, 0], 'clamp')}deg` },
    ],
  }));

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={coeurStyle}>
        <Ionicons name="heart" size={96} color={color} />
      </Animated.View>
      {PARTICULES.map((p, i) => (
        <Particule key={i} {...p} color={color} vie={vie} />
      ))}
    </View>
  );
};

const Particule: React.FC<{
  dx: number;
  dy: number;
  delai: number;
  color: string;
  vie: SharedValue<number>;
}> = ({ dx, dy, delai, color, vie }) => {
  const style = useAnimatedStyle(() => {
    // Les éclats suivent la même horloge que le cœur, légèrement décalés.
    const t = interpolate(vie.value, [0.2, 1.6], [0, 1], 'clamp');
    const retard = delai / 1000;
    const avance = Math.max(0, t - retard);
    return {
      opacity: interpolate(avance, [0, 0.15, 0.8], [0, 1, 0], 'clamp'),
      transform: [
        { translateX: dx * avance * 74 },
        { translateY: dy * avance * 74 },
        { scale: interpolate(avance, [0, 0.3, 1], [0.4, 1, 0.5], 'clamp') },
      ],
    };
  });

  return (
    <Animated.View style={[styles.particule, style]}>
      <Ionicons name="heart" size={16} color={color} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particule: {
    position: 'absolute',
  },
});

export default HeartBurst;
