import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { borderRadius, spacing, shadows, motion } from '../../../constants/theme';
import { PressableScale } from '../PressableScale';

export interface CardProps {
  children: React.ReactNode;
  /** Rend la carte pressable, avec le feedback de scale standard. */
  onPress?: () => void;
  /** Profondeur de l'ombre. `flat` retire l'ombre (cartes imbriquées). */
  elevation?: 'flat' | 'sm' | 'md' | 'lg';
  /** Retire le padding interne — cartes dont le média touche les bords. */
  flush?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Surface de contenu de l'app.
 *
 * La séparation visuelle vient exclusivement de l'ombre, jamais d'une bordure
 * grise (règle de design : « aucune bordure grise fine sur les cards »).
 */
export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  elevation = 'md',
  flush = false,
  style,
  accessibilityLabel,
}) => {
  const { colors } = useAccessibility();

  const cardStyle: StyleProp<ViewStyle> = [
    styles.card,
    !flush && styles.padded,
    { backgroundColor: colors.surface },
    elevation !== 'flat' && shadows[elevation],
    style,
  ];

  if (!onPress) {
    return <View style={cardStyle}>{children}</View>;
  }

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={motion.scale.card}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={cardStyle}
    >
      {children}
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.lg,
  },
});

export default Card;
