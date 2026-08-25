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
import * as authService from '../../services/api/auth';
import { toApiError } from '../../services/api/client';
import { spacing, typography, borderRadius, motion, withAlpha } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const { setSession, setTokens } = useAuthStore();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      setError(t('common.required'));
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const email = emailOrPhone.trim().toLowerCase();
      const result = await authService.login(email, password);

      // Confirmation par email à chaque connexion (§9.3) : le serveur vient
      // d'envoyer un code — on garde les identifiants en mémoire vive le
      // temps de la saisie, jamais dans les paramètres de navigation.
      if (authService.isOtpRequired(result)) {
        authService.rememberPendingLogin(email, password);
        router.push({
          pathname: '/otp',
          params: { destination: email, mode: 'connexion' },
        });
        return;
      }

      // Le compte a activé le second facteur : le parcours 2FA sera branché
      // avec l'écran dédié. En attendant, on l'indique clairement.
      if (!authService.isTokenPair(result)) {
        setError(t('auth.login.twoFactorRequired'));
        return;
      }

      // Poser les jetons d'abord : `fetchMe` en a besoin pour s'authentifier.
      await setTokens(result.accessToken, result.refreshToken);
      const user = await authService.fetchMe();
      await setSession(user, result.accessToken, result.refreshToken);
      router.replace('/feed');
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsLoading(false);
    }
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
