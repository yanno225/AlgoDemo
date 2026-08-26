import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
import { Skeleton } from '../../components/ui/Skeleton';
import { enterListItem } from '../../components/ui/motion';
import { getMyHistory, type HistoryEntry } from '../../services/api/auth';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  withAlpha,
} from '../../constants/theme';

/** Icône et teinte par type d'événement — le fil se lit d'un coup d'œil. */
const APPARENCE: Record<
  HistoryEntry['type'],
  { icon: keyof typeof Ionicons.glyphMap; tone: 'primary' | 'secondary' | 'success' | 'error' }
> = {
  AVIS: { icon: 'chatbox-ellipses-outline', tone: 'primary' },
  VOTE_CONSULTATION: { icon: 'checkbox-outline', tone: 'success' },
  DEBAT_REJOINT: { icon: 'tv-outline', tone: 'secondary' },
  VOTE_DEBAT: { icon: 'thumbs-up-outline', tone: 'success' },
  MESSAGE_DEBAT: { icon: 'chatbubbles-outline', tone: 'secondary' },
  COMMENTAIRE: { icon: 'chatbubble-outline', tone: 'primary' },
  SIGNALEMENT_TERRAIN: { icon: 'megaphone-outline', tone: 'error' },
  SIGNALEMENT_CONTENU: { icon: 'flag-outline', tone: 'error' },
  PRISE_PAROLE: { icon: 'mic-outline', tone: 'primary' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Le journal du citoyen : ses 100 dernières actions, comptées et datées par
 * le serveur — transparence totale sur ce que la plateforme retient, avec le
 * rappel que les choix de vote, eux, ne sont retenus par personne.
 */
export default function HistoriqueScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const insets = useSafeAreaInsets();

  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [hasError, setHasError] = useState(false);

  const charger = useCallback(async () => {
    setHasError(false);
    try {
      setEntries(await getMyHistory());
    } catch {
      setHasError(true);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const toneColor = (tone: 'primary' | 'secondary' | 'success' | 'error') =>
    tone === 'primary'
      ? colors.primary
      : tone === 'secondary'
        ? colors.secondary
        : tone === 'success'
          ? colors.success
          : colors.error;

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
          {t('parametres.historique.title')}
        </Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
      >
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: getFontSize(typography.sizes.caption),
            fontFamily: typography.families.body,
            lineHeight: 19,
            marginBottom: spacing.lg,
          }}
        >
          {t('parametres.historique.intro')} {t('parametres.historique.secretNote')}
        </Text>

        {entries === null && !hasError && (
          <View style={{ gap: spacing.sm }}>
            <Skeleton height={64} radius={borderRadius.lg} />
            <Skeleton height={64} radius={borderRadius.lg} />
            <Skeleton height={64} radius={borderRadius.lg} />
            <Skeleton height={64} radius={borderRadius.lg} />
          </View>
        )}

        {hasError && (
          <View style={[styles.stateCard, { backgroundColor: colors.surface }, shadows.sm]}>
            <Ionicons name="cloud-offline-outline" size={22} color={colors.textTertiary} />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: getFontSize(typography.sizes.bodySmall),
                fontFamily: typography.families.body,
                textAlign: 'center',
              }}
            >
              {t('parametres.historique.error')}
            </Text>
            <Button
              label={t('parametres.historique.retry')}
              onPress={() => void charger()}
              variant="outline"
              size="sm"
              haptic="light"
            />
          </View>
        )}

        {entries !== null && entries.length === 0 && (
          <View style={[styles.stateCard, { backgroundColor: colors.surface }, shadows.sm]}>
            <Ionicons name="leaf-outline" size={22} color={colors.textTertiary} />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: getFontSize(typography.sizes.bodySmall),
                fontFamily: typography.families.body,
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              {t('parametres.historique.empty')}
            </Text>
          </View>
        )}

        {(entries ?? []).map((entry, index) => {
          const apparence = APPARENCE[entry.type] ?? {
            icon: 'ellipse-outline' as const,
            tone: 'primary' as const,
          };
          const tint = toneColor(apparence.tone);
          return (
            <Animated.View
              key={`${entry.type}-${entry.date}-${index}`}
              entering={enterListItem(Math.min(index, 10))}
              style={[styles.row, { backgroundColor: colors.surface }, shadows.sm]}
            >
              <View style={[styles.rowIcon, { backgroundColor: withAlpha(tint, 0.1) }]}>
                <Ionicons name={apparence.icon} size={18} color={tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: getFontSize(typography.sizes.caption),
                    fontFamily: typography.families.bodySemiBold,
                  }}
                >
                  {t(`parametres.historique.types.${entry.type}`)}
                </Text>
                {entry.libelle ? (
                  <Text
                    numberOfLines={2}
                    style={{
                      color: colors.textSecondary,
                      fontSize: getFontSize(typography.sizes.caption),
                      fontFamily: typography.families.body,
                      marginTop: 1,
                    }}
                  >
                    {entry.libelle}
                  </Text>
                ) : null}
                <Text
                  style={{
                    color: colors.textTertiary,
                    fontSize: getFontSize(typography.sizes.micro),
                    fontFamily: typography.families.bodyMedium,
                    marginTop: 3,
                  }}
                >
                  {formatDate(entry.date)}
                </Text>
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
  iconButtonPlaceholder: {
    width: 40,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  stateCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
