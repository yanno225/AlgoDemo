import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAccessibility } from '../hooks/useAccessibility';
import { Screen } from '../components/ui/Screen';
import { PressableScale } from '../components/ui/PressableScale';
import { enterListItem, enterFade } from '../components/ui/motion';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  withAlpha,
} from '../constants/theme';

type ItemTone = 'primary' | 'secondary';

interface SettingSection {
  key: string;
  tone: ItemTone;
  items: { key: string; icon: keyof typeof Ionicons.glyphMap }[];
}

const SECTIONS: SettingSection[] = [
  {
    key: 'privacy',
    tone: 'primary',
    items: [
      { key: 'privacyPolicy', icon: 'shield-checkmark-outline' },
      { key: 'privacyCenter', icon: 'eye-outline' },
      { key: 'accountPrivacy', icon: 'lock-closed-outline' },
      { key: 'anonymisation', icon: 'eye-off-outline' },
    ],
  },
  {
    key: 'security',
    tone: 'secondary',
    items: [
      { key: 'accountSecurity', icon: 'shield-outline' },
      { key: 'myData', icon: 'sync-outline' },
    ],
  },
  {
    key: 'notifications',
    tone: 'primary',
    items: [
      { key: 'notifications', icon: 'notifications-outline' },
      { key: 'contentPreferences', icon: 'options-outline' },
      { key: 'interests', icon: 'star-outline' },
    ],
  },
  {
    key: 'storage',
    tone: 'secondary',
    items: [
      { key: 'downloads', icon: 'download-outline' },
      { key: 'activityHistory', icon: 'time-outline' },
      { key: 'devicePermissions', icon: 'phone-portrait-outline' },
    ],
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const insets = useSafeAreaInsets();

  // Les écrans de destination ne sont pas encore implémentés : on l'annonce
  // dans une bannière discrète plutôt qu'avec une alerte système bloquante.
  const [notice, setNotice] = useState('');

  const announce = (labelKey: string) => {
    setNotice(`${t(`settings.items.${labelKey}`)} — ${t('settings.comingSoon')}`);
    setTimeout(() => setNotice(''), 2600);
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
          {t('settings.title')}
        </Text>

        <View style={styles.iconButtonPlaceholder} />
      </View>

      {notice ? (
        <Animated.View
          entering={enterFade()}
          style={[styles.notice, { backgroundColor: withAlpha(colors.info, 0.12) }]}
          accessibilityLiveRegion="polite"
        >
          <Ionicons name="information-circle" size={17} color={colors.info} />
          <Text
            style={{
              flex: 1,
              color: colors.info,
              fontSize: getFontSize(typography.sizes.caption),
              fontFamily: typography.families.bodyMedium,
            }}
          >
            {notice}
          </Text>
        </Animated.View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxxl },
        ]}
      >
        {SECTIONS.map((section, sectionIndex) => {
          const tint = section.tone === 'primary' ? colors.primary : colors.secondary;

          return (
            <Animated.View
              key={section.key}
              entering={enterListItem(sectionIndex)}
              style={styles.section}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.textTertiary,
                    fontSize: getFontSize(typography.sizes.micro),
                    fontFamily: typography.families.bodyBold,
                  },
                ]}
              >
                {t(`settings.sections.${section.key}`).toUpperCase()}
              </Text>

              <View style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}>
                {section.items.map((item, itemIndex) => (
                  <View key={item.key}>
                    {itemIndex > 0 && (
                      <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
                    )}
                    <PressableScale
                      onPress={() => announce(item.key)}
                      scaleTo={0.99}
                      accessibilityRole="button"
                      accessibilityLabel={t(`settings.items.${item.key}`)}
                      style={styles.row}
                    >
                      <View
                        style={[styles.rowIcon, { backgroundColor: withAlpha(tint, 0.1) }]}
                      >
                        <Ionicons name={item.icon} size={19} color={tint} />
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          color: colors.textPrimary,
                          fontSize: getFontSize(typography.sizes.bodySmall),
                          fontFamily: typography.families.bodyMedium,
                        }}
                      >
                        {t(`settings.items.${item.key}`)}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                    </PressableScale>
                  </View>
                ))}
              </View>
            </Animated.View>
          );
        })}
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
  // Réserve la largeur du bouton retour pour que le titre reste optiquement centré.
  iconButtonPlaceholder: {
    width: 40,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginLeft: spacing.lg + 38 + spacing.md,
  },
});
