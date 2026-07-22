import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useAccessibility } from '../hooks/useAccessibility';
import { useAccessibilityStore } from '../stores/accessibilityStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import { Screen } from '../components/ui/Screen';
import { Button } from '../components/ui/Button';
import { PressableScale } from '../components/ui/PressableScale';
import { enterSection } from '../components/ui/motion';
import {
  spacing,
  typography,
  borderRadius,
  motion,
  thematicGradients,
  withAlpha,
} from '../constants/theme';

// Langues de la feuille de route. Seul le français est actif pour cette
// version ; les autres sont annoncées mais désactivées.
const LANGUAGES = [
  { code: 'fr', available: true },
  { code: 'dyu', available: false },
  { code: 'hau', available: false },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const { autoReadTTS, toggleAutoReadTTS } = useAccessibilityStore();
  const { completeOnboarding } = useOnboardingStore();

  const [language, setLanguage] = useState<string>('fr');

  // Révélation du logo : léger rebond à l'ouverture, une seule fois.
  const reveal = useSharedValue(0);
  React.useEffect(() => {
    reveal.value = withDelay(60, withSpring(1, motion.enter));
  }, [reveal]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [
      { scale: interpolate(reveal.value, [0, 1], [0.7, 1]) },
      { translateY: interpolate(reveal.value, [0, 1], [14, 0]) },
    ],
  }));

  const handleAudioToggle = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const willEnable = !autoReadTTS;
    toggleAutoReadTTS();

    // Activer l'audio le démontre aussitôt : le message d'accueil est lu à
    // voix haute. C'est le geste le plus parlant pour un public malvoyant.
    if (willEnable) {
      Speech.speak(`${t('onboarding.title')}. ${t('onboarding.subtitle')}`, {
        language: 'fr',
      });
    } else {
      Speech.stop();
    }
  };

  const handleStart = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Speech.stop();
    await completeOnboarding();
    router.replace('/login');
  };

  React.useEffect(() => {
    // Ne jamais laisser une lecture se poursuivre après avoir quitté l'écran.
    return () => {
      Speech.stop();
    };
  }, []);

  return (
    <Screen>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ─── Marque ──────────────────────────────────────────────── */}
        <Animated.View style={[styles.brand, markStyle]}>
          <LinearGradient
            colors={thematicGradients.brand}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.logo}
          >
            <MaterialCommunityIcons name="scale-balance" size={40} color="#FFFFFF" />
          </LinearGradient>

          <Text
            style={[
              styles.brandName,
              {
                color: colors.primary,
                fontSize: getFontSize(typography.sizes.h1),
                fontFamily: typography.families.heading,
              },
            ]}
          >
            {t('onboarding.brandName')}
          </Text>
          <Text
            style={[
              styles.brandTagline,
              {
                color: colors.textSecondary,
                fontSize: getFontSize(typography.sizes.bodySmall),
                fontFamily: typography.families.body,
              },
            ]}
          >
            {t('onboarding.brandTagline')}
          </Text>
        </Animated.View>

        {/* ─── Message d'accueil ───────────────────────────────────── */}
        <Animated.View entering={enterSection(160)} style={styles.welcome}>
          <Text
            style={[
              styles.title,
              {
                color: colors.textPrimary,
                fontSize: getFontSize(typography.sizes.h3),
                fontFamily: typography.families.headingSemiBold,
              },
            ]}
          >
            {t('onboarding.title')}
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
                fontSize: getFontSize(typography.sizes.body),
                fontFamily: typography.families.body,
              },
            ]}
          >
            {t('onboarding.subtitle')}
          </Text>
        </Animated.View>

        {/* ─── Lecture audio (RG-FEED-05, accessibilité) ───────────── */}
        <Animated.View entering={enterSection(240)} style={styles.audioBlock}>
          <PressableScale
            onPress={handleAudioToggle}
            haptic="none"
            accessibilityRole="switch"
            accessibilityState={{ checked: autoReadTTS }}
            accessibilityLabel={t('onboarding.audioEnable')}
            style={[
              styles.audioButton,
              {
                backgroundColor: autoReadTTS
                  ? colors.primary
                  : withAlpha(colors.secondary, 0.12),
                borderColor: autoReadTTS ? colors.primary : withAlpha(colors.secondary, 0.35),
              },
            ]}
          >
            <Ionicons
              name={autoReadTTS ? 'volume-high' : 'volume-medium-outline'}
              size={20}
              color={autoReadTTS ? '#FFFFFF' : colors.secondary}
            />
            <Text
              style={[
                styles.audioText,
                {
                  color: autoReadTTS ? '#FFFFFF' : colors.secondary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.bodySemiBold,
                },
              ]}
            >
              {autoReadTTS ? t('onboarding.audioActive') : t('onboarding.audioEnable')}
            </Text>
          </PressableScale>

          <Text
            style={[
              styles.audioHint,
              {
                color: colors.textTertiary,
                fontSize: getFontSize(typography.sizes.micro),
                fontFamily: typography.families.bodyMedium,
              },
            ]}
          >
            {t('onboarding.audioHint').toUpperCase()}
          </Text>
        </Animated.View>

        {/* ─── Choix de la langue ──────────────────────────────────── */}
        <Animated.View entering={enterSection(320)} style={styles.languageBlock}>
          <Text
            style={[
              styles.languageLabel,
              {
                color: colors.textTertiary,
                fontSize: getFontSize(typography.sizes.caption),
                fontFamily: typography.families.bodyBold,
              },
            ]}
          >
            {t('onboarding.languageLabel').toUpperCase()}
          </Text>

          <View style={styles.languageRow}>
            {LANGUAGES.map((item) => {
              const isSelected = language === item.code;
              return (
                <PressableScale
                  key={item.code}
                  onPress={() => {
                    if (!item.available) return;
                    void Haptics.selectionAsync();
                    setLanguage(item.code);
                  }}
                  disabled={!item.available}
                  scaleTo={item.available ? motion.scale.chip : 1}
                  haptic="none"
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: isSelected,
                    disabled: !item.available,
                  }}
                  accessibilityLabel={
                    item.available
                      ? t(`onboarding.languages.${item.code}`)
                      : `${t(`onboarding.languages.${item.code}`)}, ${t('onboarding.languageSoon')}`
                  }
                  style={[
                    styles.languagePill,
                    {
                      backgroundColor: isSelected ? colors.primaryPale : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      opacity: item.available ? 1 : 0.55,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.languageText,
                      {
                        color: isSelected ? colors.primary : colors.textSecondary,
                        fontSize: getFontSize(typography.sizes.bodySmall),
                        fontFamily: isSelected
                          ? typography.families.bodyBold
                          : typography.families.bodyMedium,
                      },
                    ]}
                  >
                    {t(`onboarding.languages.${item.code}`)}
                  </Text>
                  {!item.available && (
                    <Text
                      style={[
                        styles.languageSoon,
                        {
                          color: colors.textTertiary,
                          fontSize: getFontSize(typography.sizes.micro) - 1,
                          fontFamily: typography.families.body,
                        },
                      ]}
                    >
                      {t('onboarding.languageSoon')}
                    </Text>
                  )}
                </PressableScale>
              );
            })}
          </View>
        </Animated.View>

        {/* ─── Action principale ───────────────────────────────────── */}
        <Animated.View entering={enterSection(400)} style={styles.actionBlock}>
          <Button
            label={t('onboarding.start')}
            onPress={handleStart}
            size="lg"
            haptic="none"
            icon="arrow-forward"
            iconPosition="right"
          />

          <Text
            style={[
              styles.footer,
              {
                color: colors.textTertiary,
                fontSize: getFontSize(typography.sizes.caption),
                fontFamily: typography.families.body,
              },
            ]}
          >
            {t('onboarding.footer')}
          </Text>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
    gap: spacing.xxl,
  },
  brand: {
    alignItems: 'center',
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#2D4A22',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.24,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  brandName: {
    marginBottom: spacing.xs,
  },
  brandTagline: {
    textAlign: 'center',
  },
  welcome: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 320,
  },
  audioBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  audioText: {},
  audioHint: {
    letterSpacing: 0.8,
  },
  languageBlock: {
    alignItems: 'center',
    gap: spacing.md,
  },
  languageLabel: {
    letterSpacing: 1,
  },
  languageRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  languagePill: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    minWidth: 92,
  },
  languageText: {},
  languageSoon: {
    marginTop: 1,
  },
  actionBlock: {
    gap: spacing.lg,
  },
  footer: {
    textAlign: 'center',
    lineHeight: 17,
  },
});
