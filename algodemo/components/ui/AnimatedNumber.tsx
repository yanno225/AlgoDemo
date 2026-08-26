import React from 'react';
import { TextInput, StyleProp, TextStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export interface AnimatedNumberProps {
  /** Valeur cible — le texte « compte » jusqu'à elle à chaque changement. */
  value: number;
  /** Nombre de décimales affichées (virgule française). */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  delay?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * Nombre qui « compte » jusqu'à sa valeur au lieu d'apparaître d'un bloc.
 *
 * Le texte est porté par un TextInput non éditable piloté en `animatedProps` :
 * c'est le seul composant natif dont le texte peut changer à chaque frame
 * sans repasser par React. Format français (virgule, espace des milliers).
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 850,
  delay = 0,
  style,
}) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(value, { duration, easing: Easing.out(Easing.cubic) })
    );
  }, [value, delay, duration, progress]);

  const animatedProps = useAnimatedProps(() => {
    const fixe = progress.value.toFixed(decimals);
    const [entier, decimales] = fixe.split('.');
    const groupe = entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const texte = `${prefix}${groupe}${decimales ? `,${decimales}` : ''}${suffix}`;
    // `text` n'est pas dans les props typées de TextInput, mais c'est bien la
    // prop native que Reanimated sait pousser à chaque frame.
    return { text: texte, defaultValue: texte } as Record<string, unknown>;
  });

  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      // Les TextInput Android ont un rembourrage vertical par défaut qui
      // désalignerait le nombre du texte voisin.
      style={[{ padding: 0, color: '#FFFFFF' }, style]}
      animatedProps={animatedProps}
      accessible={false}
    />
  );
};

export default AnimatedNumber;
