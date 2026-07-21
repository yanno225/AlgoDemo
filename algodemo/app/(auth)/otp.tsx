import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
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
import { enterSection, enterFade } from '../../components/ui/motion';
import { useAuthStore } from '../../stores/authStore';
import { spacing, typography, borderRadius, motion, withAlpha } from '../../constants/theme';

const OTP_LENGTH = 6;
const RESEND_DELAY_SECONDS = 45;

export default function OtpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { colors, getFontSize } = useAccessibility();
  const { setSession } = useAuthStore();

  const destination = (params.destination as string) || '';

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_DELAY_SECONDS);

  // Compte à rebours avant de pouvoir redemander un code.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleVerify = useCallback(
    (submitted?: string) => {
      const value = submitted ?? code;

      if (value.length < OTP_LENGTH) {
        setError(t('auth.otp.incomplete', { count: OTP_LENGTH }));
        return;
      }

      setError('');
      setNotice('');
      setIsLoading(true);

      // TODO(backend) : POST /auth/verify-otp puis récupération du vrai jeton.
      setTimeout(async () => {
        setIsLoading(false);
        await setSession(
          {
            id: 'user_1',
            firstName: 'Kouassi',
            lastName: 'Koffi',
            age: 28,
            email: destination.includes('@') ? destination : undefined,
            phone: !destination.includes('@') ? destination : undefined,
            role: 'standard' as const,
            isActive: true,
          },
          'mock_jwt_token_from_backend'
        );
        router.replace('/feed');
      }, 1200);
    },
    [code, destination, router, setSession, t]
  );

  const handleResend = () => {
    setSecondsLeft(RESEND_DELAY_SECONDS);
    setCode('');
    setError('');
    setNotice(t('auth.otp.resent'));
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
          <AuthHeader subtitle={t('auth.otp.title')} onBack={() => router.back()} />

          <Animated.View entering={enterSection(120)} style={styles.form}>
            <View style={styles.destinationBlock}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.body,
                }}
              >
                {t('auth.otp.subtitle')}
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
            ) : notice ? (
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

            <Button
              label={t('auth.otp.submit')}
              onPress={() => handleVerify()}
              loading={isLoading}
              disabled={code.length < OTP_LENGTH}
              size="lg"
              haptic="medium"
              style={styles.submit}
            />

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
