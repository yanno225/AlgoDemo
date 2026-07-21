import React from 'react';
import { StyleSheet, View, Text, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAccessibility } from '../../../hooks/useAccessibility';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  withAlpha,
} from '../../../constants/theme';
import { Button } from '../Button';
import { PressableScale } from '../PressableScale';
import { enterDialog } from '../motion';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  /** Icône illustrant l'action, dans la pastille en tête de carte. */
  icon?: keyof typeof Ionicons.glyphMap;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  /**
   * `danger` : l'action est irréversible ou sensible. Le bouton plein reste
   * alors sur « Annuler » et la confirmation passe en lien rouge discret —
   * le geste par défaut ne doit jamais être celui qu'on regrette.
   */
  tone?: 'default' | 'danger';
}

/**
 * Boîte de dialogue de confirmation.
 *
 * Remplace `Alert.alert` : le style système ne suit ni la palette ni la
 * typographie de l'app, et son rendu diffère entre iOS et Android.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  icon = 'help-circle-outline',
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  tone = 'default',
}) => {
  const { colors, getFontSize } = useAccessibility();
  const isDanger = tone === 'danger';

  return (
    // `fade` gère la disparition : à l'inverse d'une entrée, une animation de
    // sortie Reanimated ne peut pas jouer dans une Modal, que le système
    // démonte immédiatement dès que `visible` repasse à false.
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Animated.View
        entering={FadeIn.duration(motion.durations.micro)}
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
      >
        {/* Un appui hors de la carte annule — jamais ne confirme. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        />

        <Animated.View
          entering={enterDialog()}
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: colors.surface }, shadows.lg]}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDanger
                  ? withAlpha(colors.error, 0.1)
                  : withAlpha(colors.primary, 0.1),
              },
            ]}
          >
            <Ionicons
              name={icon}
              size={22}
              color={isDanger ? colors.error : colors.primary}
            />
          </View>

          <Text
            accessibilityRole="header"
            style={[
              styles.title,
              {
                color: colors.textPrimary,
                fontSize: getFontSize(typography.sizes.h4),
                fontFamily: typography.families.headingSemiBold,
              },
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.message,
              {
                color: colors.textSecondary,
                fontSize: getFontSize(typography.sizes.caption),
                fontFamily: typography.families.body,
              },
            ]}
          >
            {message}
          </Text>

          <Button
            label={cancelLabel.toUpperCase()}
            onPress={onCancel}
            variant="outline"
            haptic="light"
            textStyle={styles.actionLabel}
            style={styles.cancelButton}
          />

          <PressableScale
            onPress={onConfirm}
            haptic={isDanger ? 'warning' : 'medium'}
            scaleTo={motion.scale.chip}
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
            style={styles.confirmLink}
          >
            <Text
              style={[
                styles.actionLabel,
                {
                  color: isDanger ? colors.error : colors.primary,
                  fontSize: getFontSize(typography.sizes.caption),
                  fontFamily: typography.families.bodyBold,
                },
              ]}
            >
              {confirmLabel.toUpperCase()}
            </Text>
          </PressableScale>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  cancelButton: {
    alignSelf: 'stretch',
  },
  actionLabel: {
    letterSpacing: 1,
  },
  confirmLink: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});

export default ConfirmDialog;
