import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Linking,
} from 'react-native';
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
import { enterListItem, enterFade } from '../../components/ui/motion';
import * as authService from '../../services/api/auth';
import { toApiError } from '../../services/api/client';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  withAlpha,
} from '../../constants/theme';

/**
 * Sécurité du compte : activation/désactivation du second facteur TOTP.
 * Quand la 2FA est active, le backend l'exige à chaque connexion — elle
 * remplace le code envoyé par email.
 */
export default function SecuriteScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();

  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  const isEnabled = user?.twoFaEnabled === true;

  const demarrer = async () => {
    setErreur('');
    setIsBusy(true);
    try {
      setSetup(await authService.enable2Fa());
    } catch (e) {
      setErreur(toApiError(e).message);
    } finally {
      setIsBusy(false);
    }
  };

  const confirmer = async () => {
    if (code.trim().length !== 6 || isBusy) return;
    setErreur('');
    setIsBusy(true);
    try {
      await authService.confirm2Fa(code.trim());
      updateUser({ twoFaEnabled: true });
      setSetup(null);
      setCode('');
      setMessage(t('parametres.securite.enabledDone'));
    } catch {
      setErreur(t('parametres.securite.error'));
    } finally {
      setIsBusy(false);
    }
  };

  const desactiver = async () => {
    if (code.trim().length !== 6 || isBusy) return;
    setErreur('');
    setIsBusy(true);
    try {
      await authService.disable2Fa(code.trim());
      updateUser({ twoFaEnabled: false });
      setCode('');
      setMessage(t('parametres.securite.disabledDone'));
    } catch {
      setErreur(t('parametres.securite.error'));
    } finally {
      setIsBusy(false);
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
          {t('parametres.securite.title')}
        </Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── État courant ────────────────────────────────────────── */}
        <Animated.View
          entering={enterListItem(0)}
          style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}
        >
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIcon,
                {
                  backgroundColor: withAlpha(
                    isEnabled ? colors.success : colors.textTertiary,
                    0.12
                  ),
                },
              ]}
            >
              <Ionicons
                name={isEnabled ? 'shield-checkmark' : 'shield-outline'}
                size={20}
                color={isEnabled ? colors.success : colors.textTertiary}
              />
            </View>
            <Text
              style={{
                flex: 1,
                color: colors.textPrimary,
                fontSize: getFontSize(typography.sizes.bodySmall),
                fontFamily: typography.families.bodyBold,
              }}
            >
              {isEnabled
                ? t('parametres.securite.statusOn')
                : t('parametres.securite.statusOff')}
            </Text>
          </View>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: getFontSize(typography.sizes.bodySmall),
              fontFamily: typography.families.body,
              lineHeight: 20,
              marginTop: spacing.md,
            }}
          >
            {t('parametres.securite.intro')}
          </Text>
        </Animated.View>

        {message ? (
          <Animated.View
            entering={enterFade()}
            style={[styles.banner, { backgroundColor: withAlpha(colors.success, 0.12) }]}
            accessibilityLiveRegion="polite"
          >
            <Ionicons name="checkmark-circle" size={17} color={colors.success} />
            <Text
              style={{
                flex: 1,
                color: colors.success,
                fontSize: getFontSize(typography.sizes.caption),
                fontFamily: typography.families.bodySemiBold,
              }}
            >
              {message}
            </Text>
          </Animated.View>
        ) : null}

        {/* ─── Activation ──────────────────────────────────────────── */}
        {!isEnabled && !setup && (
          <Animated.View entering={enterListItem(1)}>
            <Button
              label={t('parametres.securite.enable')}
              onPress={() => void demarrer()}
              disabled={isBusy}
              icon="shield-checkmark-outline"
              haptic="medium"
              size="lg"
            />
          </Animated.View>
        )}

        {!isEnabled && setup && (
          <Animated.View
            entering={enterFade()}
            style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}
          >
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: getFontSize(typography.sizes.body),
                fontFamily: typography.families.headingSemiBold,
                marginBottom: spacing.sm,
              }}
            >
              {t('parametres.securite.setupTitle')}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: getFontSize(typography.sizes.bodySmall),
                fontFamily: typography.families.body,
                lineHeight: 20,
                marginBottom: spacing.lg,
              }}
            >
              {t('parametres.securite.setupBody')}
            </Text>

            <Button
              label={t('parametres.securite.openApp')}
              onPress={() => void Linking.openURL(setup.otpauthUrl)}
              variant="outline"
              icon="key-outline"
              haptic="light"
            />

            <Text
              style={{
                color: colors.textTertiary,
                fontSize: getFontSize(typography.sizes.micro),
                fontFamily: typography.families.bodyBold,
                letterSpacing: 0.8,
                marginTop: spacing.lg,
                marginBottom: spacing.xs,
              }}
            >
              {t('parametres.securite.secretLabel').toUpperCase()}
            </Text>
            <Text
              selectable
              style={[
                styles.secret,
                {
                  backgroundColor: colors.surfaceElevated,
                  color: colors.textPrimary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                },
              ]}
            >
              {setup.secret}
            </Text>

            <TextInput
              value={code}
              onChangeText={(texte) => setCode(texte.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('parametres.securite.codePlaceholder')}
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={6}
              accessibilityLabel={t('parametres.securite.codePlaceholder')}
              style={[
                styles.codeInput,
                {
                  backgroundColor: colors.surfaceElevated,
                  color: colors.textPrimary,
                  fontSize: getFontSize(typography.sizes.h4),
                },
              ]}
            />

            <Button
              label={t('parametres.securite.confirm')}
              onPress={() => void confirmer()}
              disabled={code.trim().length !== 6 || isBusy}
              haptic="success"
              size="lg"
            />
          </Animated.View>
        )}

        {/* ─── Désactivation ───────────────────────────────────────── */}
        {isEnabled && (
          <Animated.View
            entering={enterListItem(1)}
            style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: getFontSize(typography.sizes.bodySmall),
                fontFamily: typography.families.body,
                lineHeight: 20,
                marginBottom: spacing.lg,
              }}
            >
              {t('parametres.securite.disableIntro')}
            </Text>

            <TextInput
              value={code}
              onChangeText={(texte) => setCode(texte.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('parametres.securite.codePlaceholder')}
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={6}
              accessibilityLabel={t('parametres.securite.codePlaceholder')}
              style={[
                styles.codeInput,
                {
                  backgroundColor: colors.surfaceElevated,
                  color: colors.textPrimary,
                  fontSize: getFontSize(typography.sizes.h4),
                },
              ]}
            />

            <Button
              label={t('parametres.securite.disable')}
              onPress={() => void desactiver()}
              disabled={code.trim().length !== 6 || isBusy}
              variant="danger"
              haptic="warning"
            />
          </Animated.View>
        )}

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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusIcon: {
    width: 40,
    height: 40,
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
  secret: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1.5,
    marginBottom: spacing.lg,
  },
  codeInput: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: 'Inter-Bold',
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
