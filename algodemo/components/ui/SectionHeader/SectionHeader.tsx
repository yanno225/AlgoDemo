import React from 'react';
import { StyleSheet, View, Text, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { spacing, typography, motion } from '../../../constants/theme';
import { PressableScale } from '../PressableScale';

export interface SectionHeaderProps {
  title: string;
  /** Libellé de l'action de droite. Omis : aucune action affichée. */
  actionLabel?: string;
  onActionPress?: () => void;
  /** Surtitre en petites capitales, au-dessus du titre. */
  overline?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * En-tête de section réutilisable : titre à gauche, action facultative à
 * droite. Centralisé pour que chaque écran n'aligne pas son propre couple
 * titre/lien avec des tailles légèrement différentes.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onActionPress,
  overline,
  style,
}) => {
  const { colors, getFontSize } = useAccessibility();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titles}>
        {overline && (
          <Text
            style={[
              styles.overline,
              {
                color: colors.textTertiary,
                fontSize: getFontSize(typography.sizes.micro),
                fontFamily: typography.families.bodyBold,
              },
            ]}
          >
            {overline.toUpperCase()}
          </Text>
        )}
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: getFontSize(typography.sizes.h4),
            fontFamily: typography.families.headingSemiBold,
          }}
        >
          {title}
        </Text>
      </View>

      {actionLabel && onActionPress && (
        <PressableScale
          onPress={onActionPress}
          scaleTo={motion.scale.chip}
          accessibilityRole="link"
          accessibilityLabel={actionLabel}
          style={styles.action}
        >
          <Text
            style={{
              color: colors.primary,
              fontSize: getFontSize(typography.sizes.caption),
              fontFamily: typography.families.bodyBold,
            }}
          >
            {actionLabel}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </PressableScale>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titles: {
    flex: 1,
  },
  overline: {
    letterSpacing: 1,
    marginBottom: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
  },
});

export default SectionHeader;
