import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { spacing, typography, motion, withAlpha } from '../../../constants/theme';
import { AnimatedNumber } from '../AnimatedNumber';

/**
 * Décompose « 61,1 ans » en { nombre: 61.1, decimales: 1, suffixe: ' ans' }
 * pour que le centre de la jauge puisse compter jusqu'à sa valeur. Renvoie
 * null si le texte ne commence pas par un nombre (affichage statique alors).
 */
function decomposerValeur(texte: string) {
  const m = /^(-?\d+(?:[.,]\d+)?)(.*)$/.exec(texte.trim());
  if (!m) return null;
  const nombre = Number(m[1].replace(',', '.'));
  if (!Number.isFinite(nombre)) return null;
  const partieDecimale = m[1].split(/[.,]/)[1];
  return {
    nombre,
    decimales: partieDecimale ? partieDecimale.length : 0,
    suffixe: m[2] ?? '',
  };
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CircularProgressProps {
  /** Valeur de 0 à 100. */
  percentage: number;
  label: string;
  color: string;
  size?: number;
  strokeWidth?: number;
  delay?: number;
  /** Masque le libellé interne — l'appelant le compose alors lui-même. */
  hideLabel?: boolean;
  /**
   * Texte affiché au centre à la place de « N% » — pour les indicateurs qui
   * ne sont pas des pourcentages (« 62,1 ans », « 1,2 t »).
   */
  displayValue?: string;
}

/**
 * Anneau de progression animé.
 *
 * L'animation porte sur `strokeDashoffset` via `useAnimatedProps` : la version
 * précédente interpolait cette propriété avec `useNativeDriver: true`, ce que
 * le pilote natif ne sait pas animer — l'anneau restait donc figé.
 */
export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  label,
  color,
  size = 76,
  strokeWidth = 7,
  delay = 0,
  hideLabel = false,
  displayValue,
}) => {
  const { colors, getFontSize } = useAccessibility();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));

  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(clamped, {
        duration: motion.durations.gauge,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [clamped, delay, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (circumference * progress.value) / 100,
  }));

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
    >
      <View style={styles.ring}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={withAlpha(color, 0.14)}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            fill="transparent"
            // Départ à midi plutôt qu'à 3 h : sens de lecture naturel.
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            animatedProps={animatedProps}
          />
        </Svg>

        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          {(() => {
            const centre = displayValue ?? `${clamped}%`;
            // Compte jusqu'à la valeur quand le texte s'y prête ; les libellés
            // longs restent statiques (pas d'ajustement auto sur TextInput).
            const decompose = centre.length <= 9 ? decomposerValeur(centre) : null;
            const texteStyle = {
              color: colors.textPrimary,
              fontSize: getFontSize(typography.sizes.bodySmall),
              fontFamily: typography.families.bodyBold,
              paddingHorizontal: 6,
            } as const;
            return decompose ? (
              <AnimatedNumber
                value={decompose.nombre}
                decimals={decompose.decimales}
                suffix={decompose.suffixe}
                delay={delay}
                duration={motion.durations.gauge}
                style={[texteStyle, { textAlign: 'center' }]}
              />
            ) : (
              <Text numberOfLines={1} adjustsFontSizeToFit style={texteStyle}>
                {centre}
              </Text>
            );
          })()}
        </View>
      </View>

      {!hideLabel && (
        <Text
          numberOfLines={2}
          style={[
            styles.label,
            {
              color: colors.textSecondary,
              fontSize: getFontSize(typography.sizes.micro),
              fontFamily: typography.families.bodyMedium,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  ring: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    textAlign: 'center',
    maxWidth: 88,
    lineHeight: 14,
  },
});

export default CircularProgress;
