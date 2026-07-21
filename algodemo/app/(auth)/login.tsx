import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Screen } from '../../components/ui/Screen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
import { AuthHeader } from '../../components/feature/auth/AuthHeader';
import { AuthTabs } from '../../components/feature/auth/AuthTabs';
import { enterSection } from '../../components/ui/motion';
import { useAuthStore } from '../../stores/authStore';
import { spacing, typography, borderRadius, motion, withAlpha } from '../../constants/theme';

// ─── Comptes de démonstration ────────────────────────────────────────
// TODO(backend) : à supprimer dès le branchement de POST /auth/login.
// Aucune donnée fictive ne doit subsister dans le livrable final.
const MOCK_ACCOUNTS = [
  {
    emailOrPhone: 'demo@algodemo.ci',
    password: 'demo123',
    user: {
      id: 'user_1',
      firstName: 'Kouassi',
      lastName: 'Koffi',
      age: 28,
      email: 'demo@algodemo.ci',
      phone: '+225 07 00 00 00',
      role: 'standard' as const,
      isActive: true,
    },
  },
  {
    emailOrPhone: 'admin@algodemo.ci',
    password: 'admin123',
    user: {
      id: 'user_admin',
      firstName: 'Aminata',
      lastName: 'Touré',
      age: 35,
      email: 'admin@algodemo.ci',
      phone: '+225 01 00 00 00',
      role: 'admin_labo' as const,
      isActive: true,
    },
  },
  {
    emailOrPhone: '+225 07 00 00 00',
    password: 'demo123',
    user: {
      id: 'user_1',
      firstName: 'Kouassi',
      lastName: 'Koffi',
      age: 28,
      email: 'demo@algodemo.ci',
      phone: '+225 07 00 00 00',
      role: 'standard' as const,
      isActive: true,
    },
  },
];

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const { setSession } = useAuthStore();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!emailOrPhone || !password) {
      setError(t('common.required'));
      return;
    }
    setError('');
    setIsLoading(true);

    setTimeout(async () => {
      const account = MOCK_ACCOUNTS.find(
        (a) => a.emailOrPhone === emailOrPhone.trim() && a.password === password
      );

      if (!account) {
        setIsLoading(false);
        setError(t('auth.login.invalidCredentials'));
        return;
      }

      try {
        await setSession(account.user, 'mock_jwt_token_from_backend');
        router.replace('/feed');
      } catch (err: any) {
        setError(err?.message || t('common.error'));
      } finally {
        setIsLoading(false);
      }
    }, 900);
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHeader />

          <Animated.View entering={enterSection(120)} style={styles.form}>
            <AuthTabs
              active="login"
              onChange={(tab) => {
                if (tab === 'register') router.replace('/register');
              }}
            />

            <Input
              label={t('auth.login.emailOrPhone')}
              placeholder={t('auth.login.emailOrPhonePlaceholder')}
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              icon="person-outline"
              autoCapitalize="none"
              error={error && !emailOrPhone ? error : undefined}
            />

            <Input
              label={t('auth.login.password')}
              placeholder={t('auth.login.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              icon="lock-closed-outline"
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              error={error && !password ? error : undefined}
            />

            {/* Erreur globale (identifiants refusés) — distincte des erreurs
                de champ, portées par les Input eux-mêmes. */}
            {error && emailOrPhone && password ? (
              <View
                style={[styles.errorBanner, { backgroundColor: withAlpha(colors.error, 0.1) }]}
                accessibilityLiveRegion="assertive"
              >
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text
                  style={[
                    styles.errorBannerText,
                    {
                      color: colors.error,
                      fontSize: getFontSize(typography.sizes.bodySmall),
                      fontFamily: typography.families.body,
                    },
                  ]}
                >
                  {error}
                </Text>
              </View>
            ) : null}

            <PressableScale
              onPress={() => {
                /* TODO(backend) : parcours de réinitialisation du mot de passe */
              }}
              scaleTo={motion.scale.chip}
              haptic="none"
              accessibilityRole="link"
              accessibilityLabel={t('auth.login.forgotPassword')}
              style={styles.forgotPassword}
            >
              <Text
                style={{
                  color: colors.textLink,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.bodySemiBold,
                }}
              >
                {t('auth.login.forgotPassword')}
              </Text>
            </PressableScale>

            <Button
              label={t('auth.login.submit')}
              onPress={handleLogin}
              loading={isLoading}
              size="lg"
              haptic="medium"
              icon="arrow-forward"
              iconPosition="right"
            />

            {/* RG-USR-05 : le fil public reste accessible sans authentification. */}
            <PressableScale
              onPress={() => router.replace('/feed')}
              scaleTo={motion.scale.button}
              accessibilityRole="link"
              accessibilityLabel={t('auth.login.browseWithoutAccount')}
              style={styles.guestLink}
            >
              <Ionicons name="compass-outline" size={18} color={colors.textSecondary} />
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.bodyMedium,
                }}
              >
                {t('auth.login.browseWithoutAccount')}
              </Text>
            </PressableScale>

            <View style={styles.footer}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.body,
                }}
              >
                {t('auth.login.noAccount')}{' '}
              </Text>
              <PressableScale
                onPress={() => router.replace('/register')}
                scaleTo={motion.scale.chip}
                accessibilityRole="link"
                accessibilityLabel={t('auth.login.registerLink')}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: getFontSize(typography.sizes.bodySmall),
                    fontFamily: typography.families.bodyBold,
                  }}
                >
                  {t('auth.login.registerLink')}
                </Text>
              </PressableScale>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  form: {
    width: '100%',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    flex: 1,
    lineHeight: 18,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  guestLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
