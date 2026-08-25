import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
import { AuthHeader } from '../../components/feature/auth/AuthHeader';
import { OtpInput } from '../../components/feature/auth/OtpInput';
import { OtpSuccess } from '../../components/feature/auth/OtpSuccess';
import { VerifyingDots } from '../../components/feature/auth/VerifyingDots';
import { enterSection, enterFade } from '../../components/ui/motion';
import { useAuthStore } from '../../stores/authStore';
import * as authService from '../../services/api/auth';
import { toApiError } from '../../services/api/client';
import { spacing, typography, borderRadius, motion, withAlpha } from '../../constants/theme';

const OTP_LENGTH = 6;
const RESEND_DELAY_SECONDS = 45;

export default function OtpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { colors, getFontSize } = useAccessibility();
  const { setSession, setTokens } = useAuthStore();

  const destination = (params.destination as string) || '';
  /** `connexion` = confirmation de connexion ; sinon vérification d'email. */
  const modeConnexion = params.mode === 'connexion';

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_DELAY_SECONDS);

  // Compte à rebours avant de pouvoir redemander un code.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Après la secousse d'erreur, les cases se vident d'elles-mêmes : on
  // retape sans avoir à effacer, comme dans les saisies de code réussies.
  useEffect(() => {
    if (!error || code.length < OTP_LENGTH) return;
    const timer = setTimeout(() => setCode(''), 620);
    return () => clearTimeout(timer);
  }, [error, code]);

  /**
   * Jetons obtenus → confirmation animée → session posée → feed.
   * La navigation attend la fin de l'animation : la coche verte est le
   * « c'est bien vous » que l'utilisateur doit avoir le temps de voir.
   */
  const ouvrirSession = useCallback(
    async (tokens: { accessToken: string; refreshToken: string }) => {
      Keyboard.dismiss();
      setIsVerified(true);
      const [, user] = await Promise.all([
        // Durée minimale d'affichage de la confirmation.
        new Promise((resolve) => setTimeout(resolve, 1400)),
        (async () => {
          await setTokens(tokens.accessToken, tokens.refreshToken);
          return authService.fetchMe();
        })(),
      ]);
      await setSession(user, tokens.accessToken, tokens.refreshToken);
      router.replace('/feed');
    },
    [router, setSession, setTokens]
  );

  const handleVerify = useCallback(
    async (submitted?: string) => {
      const value = submitted ?? code;

      if (value.length < OTP_LENGTH) {
        setError(t('auth.otp.incomplete', { count: OTP_LENGTH }));
        return;
      }

      setError('');
      setNotice('');
      setIsLoading(true);

      try {
        if (modeConnexion) {
          // Confirmation de connexion : le code accompagne les identifiants
          // gardés en mémoire vive. Un code faux autorise un nouvel essai —
          // ils ne sont consommés qu'au succès.
          const pending = authService.peekPendingLogin();
          if (!pending || pending.email !== destination) {
            router.replace('/login');
            return;
          }
          const result = await authService.login(
            pending.email,
            pending.password,
            value
          );
          if (authService.isTokenPair(result)) {
            authService.consumePendingLogin();
            await ouvrirSession(result);
          }
          return;
        }

        // 1. Vérifier l'email avec le code reçu (inscription).
        await authService.verifyEmail(destination, value);

        // 2. Connexion automatique — le serveur exige désormais son code de
        //    connexion : on reste sur cet écran, en mode connexion implicite.
        const pending = authService.peekPendingLogin();
        if (pending && pending.email === destination) {
          const result = await authService.login(pending.email, pending.password);
          if (authService.isTokenPair(result)) {
            authService.consumePendingLogin();
            await ouvrirSession(result);
            return;
          }
          if (authService.isOtpRequired(result)) {
            // Un nouveau code (de connexion) vient d'être envoyé.
            setCode('');
            setSecondsLeft(RESEND_DELAY_SECONDS);
            setNotice(t('auth.otp.resent'));
            router.setParams({ mode: 'connexion' });
            return;
          }
        }

        // Pas d'identifiants en mémoire (arrivée directe sur cet écran) :
        // l'email est vérifié, on renvoie vers la connexion.
        router.replace('/login');
      } catch (err) {
        setError(toApiError(err).message);
      } finally {
        setIsLoading(false);
      }
    },
    [code, destination, modeConnexion, ouvrirSession, router, t]
  );

  const handleResend = async () => {
    setError('');
    setIsResending(true);
    try {
      if (modeConnexion) {
        // Redemander un code de connexion = refaire l'appel sans code.
        const pending = authService.peekPendingLogin();
        if (!pending) {
          router.replace('/login');
          return;
        }
        await authService.login(pending.email, pending.password);
      } else {
        await authService.resendOtp(destination);
      }
      setSecondsLeft(RESEND_DELAY_SECONDS);
      setCode('');
      setNotice(t('auth.otp.resent'));
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsResending(false);
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
          <AuthHeader
            subtitle={modeConnexion ? t('auth.otp.loginTitle') : t('auth.otp.title')}
            onBack={() => router.back()}
          />

          <Animated.View entering={enterSection(120)} style={styles.form}>
            {isVerified ? (
              /* Code accepté : le formulaire cède la place à la coche verte
                 pendant que la session s'ouvre en coulisses. */
              <OtpSuccess label={t('auth.otp.verified')} />
            ) : (
            <>
            <View style={styles.destinationBlock}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.body,
                }}
              >
                {modeConnexion ? t('auth.otp.loginSubtitle') : t('auth.otp.subtitle')}
              </Text>
              <View
                style={[
                  styles.destinationChip,
                  { backgroundColor: withAlpha(colors.primary, 0.08) },
                ]}
              >
                <Ionicons
                  name={destination.includes('@') ? 'mail-outline' : 'call-outline'}
                  size={16}
                  color={colors.primary}
                />
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: getFontSize(typography.sizes.bodySmall),
                    fontFamily: typography.families.bodyBold,
                  }}
                >
                  {destination}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.codeLabel,
                {
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.caption),
                  fontFamily: typography.families.bodySemiBold,
                },
              ]}
            >
              {t('auth.otp.codeLabel').toUpperCase()}
            </Text>

            <OtpInput
              value={code}
              onChangeText={(next) => {
                setCode(next);
                if (error) setError('');
              }}
              length={OTP_LENGTH}
              error={!!error}
              onComplete={handleVerify}
            />

            {error ? (
              <Animated.Text
                entering={enterFade()}
                accessibilityLiveRegion="assertive"
                style={[
                  styles.message,
                  {
                    color: colors.error,
                    fontSize: getFontSize(typography.sizes.caption),
                    fontFamily: typography.families.body,
                  },
                ]}
              >
                {error}
              </Animated.Text>
            ) : notice && !isLoading && !isResending ? (
              <Animated.Text
                entering={enterFade()}
                accessibilityLiveRegion="polite"
                style={[
                  styles.message,
                  {
                    color: colors.success,
                    fontSize: getFontSize(typography.sizes.caption),
                    fontFamily: typography.families.body,
                  },
                ]}
              >
                {notice}
              </Animated.Text>
            ) : null}

            {/* Pendant que le serveur travaille, le bouton s'efface au profit
                des cinq points FID qui dansent — l'attente raconte la marque. */}
            {isLoading || isResending ? (
              <Animated.View entering={enterFade()} style={styles.submit}>
                <VerifyingDots
                  label={
                    isVerified
                      ? t('auth.otp.verified')
                      : isResending
                        ? t('auth.otp.sending')
                        : t('auth.otp.verifying')
                  }
                />
              </Animated.View>
            ) : (
              <Button
                label={t('auth.otp.submit')}
                onPress={() => handleVerify()}
                disabled={code.length < OTP_LENGTH}
                size="lg"
                haptic="medium"
                style={styles.submit}
              />
            )}

            <PressableScale
              onPress={handleResend}
              disabled={secondsLeft > 0}
              scaleTo={motion.scale.chip}
              accessibilityRole="button"
              accessibilityLabel={t('auth.otp.resend')}
              style={styles.resend}
            >
              <Text
                style={{
                  color: secondsLeft > 0 ? colors.textTertiary : colors.textLink,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.bodySemiBold,
                }}
              >
                {secondsLeft > 0
                  ? t('auth.otp.resendIn', { seconds: secondsLeft })
                  : t('auth.otp.resend')}
              </Text>
            </PressableScale>
            </>
            )}
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
  destinationBlock: {
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  destinationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  codeLabel: {
    letterSpacing: 0.8,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  message: {
    marginTop: spacing.md,
    marginLeft: spacing.xs,
  },
  submit: {
    marginTop: spacing.xxl,
  },
  resend: {
    alignSelf: 'center',
    paddingVertical: spacing.lg,
  },
});
