import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { PressableScale } from '../../../components/ui/PressableScale';
import { TAB_BAR_CLEARANCE } from '../../../components/ui/Screen';
import { enterListItem, enterFade } from '../../../components/ui/motion';
import {
  SignalementForm,
  SignalementDraft,
} from '../../../components/feature/participation/SignalementForm';
import {
  SignalementCard,
  Signalement,
} from '../../../components/feature/participation/SignalementCard';
import { spacing, typography, motion, borderRadius, withAlpha } from '../../../constants/theme';

// TODO(backend) : remplacer par GET /signalements?commune=…
const INITIAL_SIGNALEMENTS: Signalement[] = [
  {
    id: 'sig_1',
    title: 'Affaissement de chaussée',
    description:
      'Signalé au 24 Rue de la République. Risque pour les cyclistes, nécessite une intervention rapide.',
    category: 'Voirie',
    time: 'Il y a 2 h',
    status: 'progress',
    imageUri: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=800',
    supports: 12,
    comments: 3,
  },
  {
    id: 'sig_2',
    title: "Panneau d'affichage hors service",
    description:
      "Le panneau d'information numérique de la Place de la Mairie n'affiche plus les horaires de bus.",
    category: 'Éclairage',
    time: 'Hier',
    status: 'resolved',
    imageUri: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800',
    supports: 45,
    comments: 8,
  },
];

export default function SignalementsScreen() {
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const insets = useSafeAreaInsets();

  const [signalements, setSignalements] = useState(INITIAL_SIGNALEMENTS);
  const [confirmation, setConfirmation] = useState('');

  const handleSubmit = (draft: SignalementDraft) => {
    setSignalements((current) => [
      {
        id: `sig_${Date.now()}`,
        title: draft.category,
        description: draft.description,
        category: draft.category,
        time: "À l'instant",
        status: 'progress',
        imageUri: draft.photoUri ?? undefined,
        supports: 0,
        comments: 0,
      },
      ...current,
    ]);
    setConfirmation(t('participation.signalements.sent'));
    setTimeout(() => setConfirmation(''), 4000);
  };

  return (
    <FlatList
      data={signalements}
      keyExtractor={(item) => item.id}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: TAB_BAR_CLEARANCE + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <SignalementForm onSubmit={handleSubmit} />

          {confirmation ? (
            <Animated.View
              entering={enterFade()}
              style={[styles.confirmation, { backgroundColor: withAlpha(colors.success, 0.12) }]}
              accessibilityLiveRegion="polite"
            >
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text
                style={{
                  flex: 1,
                  color: colors.success,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.bodySemiBold,
                }}
              >
                {confirmation}
              </Text>
            </Animated.View>
          ) : null}

          <View style={styles.sectionHeader}>
            <Text
              style={[
                {
                  color: colors.textPrimary,
                  fontSize: getFontSize(typography.sizes.h4),
                  fontFamily: typography.families.headingSemiBold,
                },
              ]}
            >
              {t('participation.signalements.recentTitle')}
            </Text>
            <PressableScale
              onPress={() => {
                /* TODO(backend) : liste complète paginée des signalements */
              }}
              scaleTo={motion.scale.chip}
              accessibilityRole="link"
              accessibilityLabel={t('participation.signalements.seeAll')}
              style={styles.seeAll}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: getFontSize(typography.sizes.caption),
                  fontFamily: typography.families.bodyBold,
                }}
              >
                {t('participation.signalements.seeAll')}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </PressableScale>
          </View>
        </View>
      }
      renderItem={({ item, index }) => (
        <Animated.View entering={enterListItem(index)} style={styles.cardSlot}>
          <SignalementCard item={item} />
        </Animated.View>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="megaphone-outline" size={44} color={colors.textTertiary} />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: getFontSize(typography.sizes.bodySmall),
              fontFamily: typography.families.body,
              textAlign: 'center',
            }}
          >
            {t('participation.signalements.empty')}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  confirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
  },
  cardSlot: {
    marginBottom: spacing.md,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
  },
});
