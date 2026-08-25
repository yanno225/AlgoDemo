import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useAuthStore } from '../../stores/authStore';
import { Screen } from '../../components/ui/Screen';
import { PressableScale } from '../../components/ui/PressableScale';
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
 * Consentement RGPD aux notifications de la plateforme. Le serveur le
 * respecte à la lettre : sans consentement, `findIdsConsentants` exclut le
 * compte de toutes les diffusions (débats, résultats, modération).
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();

  const [erreur, setErreur] = useState('');
  const consent = user?.notifConsent ?? false;

  const basculer = async (valeur: boolean) => {
    setErreur('');
    // Retour visuel immédiat ; retour arrière si le serveur refuse.
    updateUser({ notifConsent: valeur });
    try {
      const misAJour = await authService.updateConsent({
        consentementNotifications: valeur,
      });
      updateUser({ notifConsent: misAJour.notifConsent });
    } catch {
      updateUser({ notifConsent: !valeur });
      setErreur(t('parametres.notifications.error'));
    }
  };

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
          {t('parametres.notifications.title')}
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
          <View style={styles.row}>
            <View style={styles.texts}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.bodySemiBold,
                }}
              >
                {t('parametres.notifications.consentTitle')}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.caption),
                  fontFamily: typography.families.body,
                  lineHeight: 17,
                  marginTop: 2,
                }}
              >
                {t('parametres.notifications.consentDesc')}
              </Text>
            </View>
            <Switch
              value={consent}
              onValueChange={(valeur) => void basculer(valeur)}
              trackColor={{ false: colors.border, true: withAlpha(colors.primary, 0.5) }}
              thumbColor={consent ? colors.primary : colors.surfaceElevated}
              accessibilityLabel={t('parametres.notifications.consentTitle')}
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={enterListItem(1)}
          style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}
        >
          <View style={styles.row}>
            <View style={[styles.infoIcon, { backgroundColor: withAlpha(colors.info, 0.12) }]}>
              <Ionicons name="alarm-outline" size={19} color={colors.info} />
            </View>
            <View style={styles.texts}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.bodySemiBold,
                }}
              >
                {t('parametres.notifications.remindersTitle')}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.caption),
                  fontFamily: typography.families.body,
                  lineHeight: 17,
                  marginTop: 2,
                }}
              >
                {t('parametres.notifications.remindersDesc')}
              </Text>
            </View>
          </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  texts: {
    flex: 1,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
});
