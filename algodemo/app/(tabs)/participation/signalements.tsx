import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { useAuthStore } from '../../../stores/authStore';
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
import {
  createReport,
  listMyReports,
  listRecentReports,
  type CitizenReport,
} from '../../../services/api/participation';
import { spacing, typography, borderRadius, withAlpha } from '../../../constants/theme';

/** « Il y a 2 h », « Hier », « 12 août » — l'horodatage court des cartes. */
function formatRelatif(iso: string): string {
  const ecartMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ecartMs / 60_000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `Il y a ${heures} h`;
  if (heures < 48) return 'Hier';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });
}

export default function SignalementsScreen() {
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const { isAuthenticated } = useAuthStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [recents, setRecents] = useState<CitizenReport[]>([]);
  const [miens, setMiens] = useState<CitizenReport[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  const charger = useCallback(() => {
    listRecentReports().then(setRecents).catch(() => {});
    if (useAuthStore.getState().isAuthenticated) {
      listMyReports().then(setMiens).catch(() => {});
    } else {
      setMiens([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  const handleSubmit = async (draft: SignalementDraft) => {
    if (!isAuthenticated) {
      Alert.alert(
        t('participation.signalements.formTitle'),
        t('participation.signalements.loginRequired'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('liveRoom.signIn'), onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    setIsSending(true);
    try {
      const cree = await createReport({
        categoryKey: draft.categoryKey,
        description: draft.description,
        address: draft.location,
        latitude: draft.latitude,
        longitude: draft.longitude,
        photoUri: draft.photoUri,
      });
      setMiens((current) => [cree, ...current]);
      setConfirmation(t('participation.signalements.sent'));
      setTimeout(() => setConfirmation(''), 4000);
    } catch {
      Alert.alert(
        t('participation.signalements.formTitle'),
        t('participation.signalements.sendError')
      );
    } finally {
      setIsSending(false);
    }
  };

  const versCarte = (report: CitizenReport): Signalement => ({
    id: report.id,
    title: report.description,
    description: t('participation.signalements.reportedAt', {
      address: report.address,
    }),
    category: t(`participation.signalements.categories.${report.categoryKey}`),
    time: formatRelatif(report.createdAt),
    status: report.status === 'RESOLU' ? 'resolved' : 'progress',
    statusLabel:
      report.status === 'RECU'
        ? t('participation.status.received')
        : report.status === 'REJETE'
          ? t('participation.status.rejected')
          : undefined,
    imageUri: report.photoUrl ?? undefined,
  });

  // Mes signalements d'abord (suivi de dossier), puis le fil public — sans
  // doublon : un signalement à moi n'apparaît qu'une fois.
  const idsMiens = new Set(miens.map((report) => report.id));
  const filPublic = recents.filter((report) => !idsMiens.has(report.id));

  const sections: { cle: string; titre: string; items: CitizenReport[] }[] = [
    ...(miens.length > 0
      ? [
          {
            cle: 'miens',
            titre: t('participation.signalements.myTitle'),
            items: miens,
          },
        ]
      : []),
    {
      cle: 'recents',
      titre: t('participation.signalements.recentTitle'),
      items: filPublic,
    },
  ];

  const lignes = sections.flatMap((section) => [
    { type: 'entete' as const, cle: section.cle, titre: section.titre },
    ...section.items.map((item) => ({ type: 'carte' as const, cle: item.id, item })),
  ]);

  return (
    <FlatList
      data={lignes}
      keyExtractor={(ligne) => ligne.cle}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: TAB_BAR_CLEARANCE + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <SignalementForm onSubmit={(draft) => void handleSubmit(draft)} isSending={isSending} />

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
        </View>
      }
      renderItem={({ item: ligne, index }) =>
        ligne.type === 'entete' ? (
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.textPrimary,
                fontSize: getFontSize(typography.sizes.h4),
                fontFamily: typography.families.headingSemiBold,
              },
            ]}
          >
            {ligne.titre}
          </Text>
        ) : (
          <Animated.View entering={enterListItem(Math.min(index, 6))} style={styles.cardSlot}>
            <SignalementCard item={versCarte(ligne.item)} />
          </Animated.View>
        )
      }
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
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
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
