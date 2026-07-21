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
import { PasswordStrength } from '../../components/feature/auth/PasswordStrength';
import { enterSection } from '../../components/ui/motion';
import { spacing, typography, borderRadius, motion, withAlpha } from '../../constants/theme';

const MIN_PASSWORD_LENGTH = 8;
const MIN_AGE = 13;

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize, currentHitSlop } = useAccessibility();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};

    if (!firstName) next.firstName = t('common.required');
    if (!lastName) next.lastName = t('common.required');

    if (!age) next.age = t('common.required');
    else if (Number.isNaN(Number(age)) || Number(age) < MIN_AGE) {
      next.age = t('auth.register.ageInvalid');
    }

    if (!emailOrPhone) next.emailOrPhone = t('common.required');

    if (!password) next.password = t('common.required');
    else if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = t('auth.register.passwordTooShort');
    }

    // RG-USR-07 : acceptation obligatoire avant soumission.
    if (!acceptTerms) next.acceptTerms = t('auth.register.termsRequired');

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;

    setIsLoading(true);
    // TODO(backend) : POST /auth/register, puis envoi du code de vérification.
    setTimeout(() => {
      setIsLoading(false);
      router.push({ pathname: '/otp', params: { destination: emailOrPhone } });
    }, 1200);
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
              active="register"
              onChange={(tab) => {
                if (tab === 'login') router.replace('/login');
              }}
            />
            <View style={styles.row}>
              <Input
                label={t('auth.register.firstName')}
                placeholder={t('auth.register.firstNamePlaceholder')}
                value={firstName}
                onChangeText={setFirstName}
                style={styles.halfInput}
                error={errors.firstName}
              />
              <Input
                label={t('auth.register.lastName')}
                placeholder={t('auth.register.lastNamePlaceholder')}
                value={lastName}
                onChangeText={setLastName}
                style={styles.halfInput}
                error={errors.lastName}
              />
            </View>

            <Input
              label={t('auth.register.age')}
              placeholder={t('auth.register.agePlaceholder')}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              icon="calendar-outline"
              error={errors.age}
            />

            <Input
              label={t('auth.login.emailOrPhone')}
              placeholder={t('auth.login.emailOrPhonePlaceholder')}
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
              error={errors.emailOrPhone}
            />

            <Input
              label={t('auth.register.password')}
              placeholder={t('auth.register.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon="lock-closed-outline"
              error={errors.password}
            />
            <PasswordStrength password={password} />

            {/* RG-USR-07 : case obligatoire avant soumission de l'inscription. */}
            <PressableScale
              onPress={() => setAcceptTerms((v) => !v)}
              scaleTo={0.99}
              hitSlop={currentHitSlop}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptTerms }}
              accessibilityLabel={t('auth.register.termsAccept')}
              style={[
                styles.termsRow,
                {
                  backgroundColor: acceptTerms
                    ? withAlpha(colors.primary, 0.07)
                    : colors.surface,
                  borderColor: errors.acceptTerms ? colors.error : 'transparent',
                },
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: acceptTerms ? colors.primary : colors.border,
                    backgroundColor: acceptTerms ? colors.primary : 'transparent',
                  },
                ]}
              >
                {acceptTerms && <Ionicons name="checkmark" size={15} color={colors.textInverse} />}
              </View>
              <Text
                style={[
                  styles.termsLabel,
                  {
                    color: colors.textPrimary,
                    fontSize: getFontSize(typography.sizes.bodySmall),
                    fontFamily: typography.families.body,
                  },
                ]}
              >
                {t('auth.register.termsAccept')}
              </Text>
            </PressableScale>

            {errors.acceptTerms && (
              <Text
                accessibilityLiveRegion="assertive"
                style={[
                  styles.termsError,
                  {
                    color: colors.error,
                    fontSize: getFontSize(typography.sizes.caption),
                    fontFamily: typography.families.body,
                  },
                ]}
              >
                {errors.acceptTerms}
              </Text>
            )}

            <Button
              label={t('auth.register.submit')}
              onPress={handleRegister}
              loading={isLoading}
              size="lg"
              haptic="medium"
              style={styles.submit}
            />

            <View style={styles.footer}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.body,
                }}
              >
                {t('auth.register.alreadyAccount')}{' '}
              </Text>
              <PressableScale
                onPress={() => router.replace('/login')}
                scaleTo={motion.scale.chip}
                accessibilityRole="link"
                accessibilityLabel={t('auth.register.loginLink')}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: getFontSize(typography.sizes.bodySmall),
                    fontFamily: typography.families.bodyBold,
                  }}
                >
                  {t('auth.register.loginLink')}
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.xs + 2,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsLabel: {
    flex: 1,
    lineHeight: 19,
  },
  termsError: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  submit: {
    marginTop: spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});
