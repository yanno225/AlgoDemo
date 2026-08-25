import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useAuthStore } from '../../stores/authStore';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { enterListItem, enterFade } from '../../components/ui/motion';
import * as authService from '../../services/api/auth';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  withAlpha,
} from '../../constants/theme';

/**
 * Anonymisation RGPD (RG-USR-07) — IRRÉVERSIBLE. Le serveur détache
 * l'identité du compte ; les contributions passées s'affichent « Citoyen »
 * partout, rétroactivement (les noms sont résolus à la lecture, jamais
 * stockés). Les sessions sont révoquées : on repart à l'écran de connexion.
 */
export default function AnonymisationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const insets = useSafeAreaInsets();
  const { clearSession } = useAuthStore();

  const [isConfirmVisible, setConfirmVisible] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [erreur, setErreur] = useState('');

  const anonymiser = async () => {
    setConfirmVisible(false);
    setErreur('');
    setIsBusy(true);
    try {
      await authService.anonymiser();
      // Les sessions sont révoquées côté serveur : on purge la nôtre.
      await clearSession();
      router.replace('/login');
    } catch {
      setErreur(t('parametres.anonymisation.error'));
      setIsBusy(false);
    }
  };

  const effets = ['effet1', 'effet2', 'effet3', 'effet4'] as const;

  return (
    <Screen>
      <View style={styles.header}>
        <PressableScale
          onPress={() => router.back()}
          scaleTo={motion.scale.chip}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={[styles.iconButton, { backgroundColor: colors.surface }, shadows.sm]}
        >
          <Ionicons name="arrow-back" size={21} color={colors.textPrimary} />
        </PressableScale>
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: getFontSize(typography.sizes.h4),
            fontFamily: typography.families.headingSemiBold,
          }}
        >
          {t('parametres.anonymisation.title')}
        </Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
      >
        <Animated.View
          entering={enterListItem(0)}
          style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}
        >
          <View style={[styles.warning, { backgroundColor: withAlpha(colors.error, 0.1) }]}>
            <Ionicons name="warning-outline" size={17} color={colors.error} />
            <Text
              style={{
                flex: 1,
                color: colors.error,
                fontSize: getFontSize(typography.sizes.caption),
                fontFamily: typography.families.bodyBold,
              }}
            >
              {t('parametres.anonymisation.warningTitle').toUpperCase()}
            </Text>
          </View>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: getFontSize(typography.sizes.bodySmall),
              fontFamily: typography.families.body,
              lineHeight: 20,
              marginTop: spacing.lg,
              marginBottom: spacing.md,
            }}
          >
            {t('parametres.anonymisation.intro')}
          </Text>

          {effets.map((effet) => (
            <View key={effet} style={styles.effet}>
              <Ionicons
                name={effet === 'effet4' ? 'lock-closed-outline' : 'eye-off-outline'}
                size={15}
                color={colors.textTertiary}
                style={styles.effetIcone}
              />
              <Text
                style={{
                  flex: 1,
                  color: colors.textPrimary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.body,
                  lineHeight: 19,
                }}
              >
                {t(`parametres.anonymisation.${effet}`)}
              </Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={enterListItem(1)}>
          <Button
            label={t('parametres.anonymisation.action')}
            onPress={() => setConfirmVisible(true)}
            disabled={isBusy}
            variant="danger"
            icon="eye-off-outline"
            haptic="warning"
            size="lg"
          />
        </Animated.View>

        {erreur ? (
          <Animated.View
            entering={enterFade()}
            style={[styles.banner, { backgroundColor: withAlpha(colors.error, 0.1) }]}
            accessibilityLiveRegion="assertive"
          >
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text
              style={{
                flex: 1,
                color: colors.error,
                fontSize: getFontSize(typography.sizes.caption),
                fontFamily: typography.families.body,
              }}
            >
              {erreur}
            </Text>
          </Animated.View>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={isConfirmVisible}
        title={t('parametres.anonymisation.confirmTitle')}
        message={t('parametres.anonymisation.confirmBody')}
        cancelLabel={t('parametres.anonymisation.confirmCancel')}
        confirmLabel={t('parametres.anonymisation.confirmAction')}
        tone="danger"
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => void anonymiser()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonPlaceholder: {
    width: 40,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  effet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  effetIcone: {
    marginTop: 2,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
});
