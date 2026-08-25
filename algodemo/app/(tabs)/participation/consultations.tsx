import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { useAuthStore } from '../../../stores/authStore';
import { Button } from '../../../components/ui/Button';
import { PressableScale } from '../../../components/ui/PressableScale';
import { TAB_BAR_CLEARANCE } from '../../../components/ui/Screen';
import { enterListItem, enterSheet, enterFade } from '../../../components/ui/motion';
import { StatusPill } from '../../../components/feature/participation/StatusPill';
import { ProgressBar } from '../../../components/feature/participation/ProgressBar';
import { toApiError } from '../../../services/api/client';
import {
  listConsultations,
  voteConsultation,
  hasVoted,
  getResults,
  type Consultation,
  type ConsultationResult,
} from '../../../services/api/consultations';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  scrimGradient,
  scrimLocations,
} from '../../../constants/theme';

const BLURHASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

const formatDateCourte = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

type Feuille =
  | { type: 'vote'; consultation: Consultation }
  | { type: 'resultats'; consultation: Consultation }
  | null;

export default function ConsultationsScreen() {
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const { isAuthenticated } = useAuthStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [consultations, setConsultations] = useState<Consultation[] | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [feuille, setFeuille] = useState<Feuille>(null);
  const [choix, setChoix] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [resultats, setResultats] = useState<ConsultationResult[] | null>(null);

  const charger = useCallback(async () => {
    try {
      // Les sondages vivent dans leur propre onglet.
      const liste = await listConsultations('toutes', 'CONSULTATION');
      // Ouvertes d'abord (l'action possible), puis à venir, puis l'historique.
      const poids = { open: 0, upcoming: 1, closed: 2 } as const;
      liste.sort((a, b) => poids[a.status] - poids[b.status]);
      setConsultations(liste);

      // L'émargement dit si j'ai déjà voté — jamais pour quoi.
      if (useAuthStore.getState().isAuthenticated) {
        const ouvertes = liste.filter((c) => c.status === 'open');
        const etats = await Promise.all(
          ouvertes.map((c) => hasVoted(c.id).catch(() => false))
        );
        setVotedIds(
          new Set(ouvertes.filter((_, index) => etats[index]).map((c) => c.id))
        );
      }
    } catch {
      setConsultations((current) => current ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void charger();
    }, [charger])
  );

  const ouvrirVote = (consultation: Consultation) => {
    if (!isAuthenticated) {
      Alert.alert(
        t('participation.consultations.voteTitle'),
        t('participation.consultations.loginToVote'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('liveRoom.signIn'), onPress: () => router.push('/login') },
        ]
      );
      return;
    }
    setChoix(null);
    setFeuille({ type: 'vote', consultation });
  };

  const deposerBulletin = async () => {
    if (feuille?.type !== 'vote' || !choix || isVoting) return;
    setIsVoting(true);
    try {
      await voteConsultation(feuille.consultation.id, choix);
      setVotedIds((current) => new Set(current).add(feuille.consultation.id));
      setFeuille(null);
    } catch (erreur) {
      Alert.alert(
        t('participation.consultations.voteTitle'),
        toApiError(erreur).message || t('participation.consultations.voteError')
      );
    } finally {
      setIsVoting(false);
    }
  };

  const ouvrirResultats = (consultation: Consultation) => {
    setResultats(null);
    setFeuille({ type: 'resultats', consultation });
    getResults(consultation.id)
      .then(setResultats)
      .catch(() => setResultats([]));
  };

  return (
    <>
      <FlatList
        data={consultations ?? []}
        keyExtractor={(item) => item.id}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_CLEARANCE + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Animated.View entering={enterListItem(0)} style={styles.banner}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=900',
              }}
              placeholder={{ blurhash: BLURHASH }}
              contentFit="cover"
              transition={220}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={scrimGradient}
              locations={scrimLocations}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.bannerContent}>
              <Text
                style={[
                  styles.bannerTitle,
                  {
                    fontSize: getFontSize(typography.sizes.h3),
                    fontFamily: typography.families.heading,
                  },
                ]}
              >
                {t('participation.consultations.workshopsTitle')}
              </Text>
              <Text
                style={[
                  styles.bannerSubtitle,
                  {
                    fontSize: getFontSize(typography.sizes.bodySmall),
                    fontFamily: typography.families.body,
                  },
                ]}
              >
                {t('participation.consultations.workshopsSubtitle')}
              </Text>
            </View>
          </Animated.View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={enterListItem(Math.min(index + 1, 6))}>
            <View style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}>
              <View style={styles.cardHeader}>
                {item.status === 'open' && (
                  <StatusPill label={t('participation.status.open')} tone="open" pulse />
                )}
                {item.status === 'upcoming' && (
                  <StatusPill label={t('participation.status.upcoming')} tone="progress" />
                )}
                {item.status === 'closed' && (
                  <StatusPill label={t('participation.status.closed')} tone="closed" />
                )}
                <Text
                  style={{
                    color: colors.textTertiary,
                    fontSize: getFontSize(typography.sizes.micro),
                    fontFamily: typography.families.bodyMedium,
                  }}
                >
                  {item.status === 'open'
                    ? t('participation.status.daysLeft', { count: item.daysLeft })
                    : item.status === 'upcoming'
                      ? t('participation.status.opensOn', {
                          date: formatDateCourte(item.opensAt),
                        })
                      : formatDateCourte(item.closesAt)}
                </Text>
              </View>

              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: colors.textPrimary,
                    fontSize: getFontSize(typography.sizes.body),
                    fontFamily: typography.families.headingSemiBold,
                  },
                ]}
              >
                {item.title}
              </Text>

              <Text
                style={[
                  styles.cardDescription,
                  {
                    color: colors.textSecondary,
                    fontSize: getFontSize(typography.sizes.bodySmall),
                    fontFamily: typography.families.body,
                  },
                ]}
              >
                {item.plainSummary}
              </Text>

              {/* Les options en jeu, visibles avant même d'ouvrir le vote. */}
              <View style={styles.options}>
                {item.options.map((option) => (
                  <View
                    key={option.id}
                    style={[styles.optionChip, { backgroundColor: colors.surfaceElevated }]}
                  >
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: getFontSize(typography.sizes.micro),
                        fontFamily: typography.families.bodyMedium,
                      }}
                    >
                      {option.label}
                    </Text>
                  </View>
                ))}
              </View>

              {item.status === 'open' &&
                (votedIds.has(item.id) ? (
                  <View style={styles.votedRow}>
                    <Ionicons name="checkmark-circle" size={17} color={colors.success} />
                    <Text
                      style={{
                        color: colors.success,
                        fontSize: getFontSize(typography.sizes.bodySmall),
                        fontFamily: typography.families.bodySemiBold,
                      }}
                    >
                      {t('participation.consultations.alreadyVoted')}
                    </Text>
                  </View>
                ) : (
                  <Button
                    label={t('participation.consultations.vote')}
                    onPress={() => ouvrirVote(item)}
                    icon="checkbox-outline"
                    haptic="medium"
                    size="sm"
                  />
                ))}

              {item.status === 'closed' &&
                (item.resultsPublished ? (
                  <Button
                    label={t('participation.consultations.seeResults')}
                    onPress={() => ouvrirResultats(item)}
                    variant="outline"
                    icon="stats-chart-outline"
                    size="sm"
                  />
                ) : (
                  <Text
                    style={{
                      color: colors.textTertiary,
                      fontSize: getFontSize(typography.sizes.caption),
                      fontFamily: typography.families.bodyMedium,
                    }}
                  >
                    {t('participation.consultations.resultsPending')}
                  </Text>
                ))}
            </View>
          </Animated.View>
        )}
        ListEmptyComponent={
          consultations === null ? (
            <View style={styles.empty}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={44} color={colors.textTertiary} />
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.body,
                }}
              >
                {t('participation.consultations.empty')}
              </Text>
            </View>
          )
        }
      />

      {/* ─── Feuille : vote à bulletin secret / résultats ───────────── */}
      <Modal
        visible={!!feuille}
        transparent
        animationType="fade"
        onRequestClose={() => setFeuille(null)}
      >
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          {feuille && (
            <Animated.View
              entering={enterSheet()}
              style={[styles.sheet, { backgroundColor: colors.surface }, shadows.lg]}
            >
              <View style={[styles.grabber, { backgroundColor: colors.border }]} />

              <View style={styles.sheetHeader}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: getFontSize(typography.sizes.h4),
                    fontFamily: typography.families.headingSemiBold,
                  }}
                >
                  {feuille.type === 'vote'
                    ? t('participation.consultations.voteTitle')
                    : t('participation.consultations.resultsTitle')}
                </Text>
                <PressableScale
                  onPress={() => setFeuille(null)}
                  scaleTo={motion.scale.chip}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.cancel')}
                  style={[styles.close, { backgroundColor: colors.surfaceElevated }]}
                >
                  <Ionicons name="close" size={19} color={colors.textSecondary} />
                </PressableScale>
              </View>

              <Text
                style={[
                  styles.sheetQuestion,
                  {
                    color: colors.textSecondary,
                    fontSize: getFontSize(typography.sizes.bodySmall),
                    fontFamily: typography.families.body,
                  },
                ]}
              >
                {feuille.consultation.title}
              </Text>

              {feuille.type === 'vote' && (
                <>
                  <View style={styles.optionsSheet}>
                    {feuille.consultation.options.map((option) => {
                      const isSelected = choix === option.id;
                      return (
                        <PressableScale
                          key={option.id}
                          onPress={() => setChoix(option.id)}
                          scaleTo={0.985}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: isSelected }}
                          accessibilityLabel={option.label}
                          style={[
                            styles.option,
                            {
                              backgroundColor: colors.surfaceElevated,
                              borderColor: isSelected ? colors.primary : 'transparent',
                            },
                          ]}
                        >
                          <Text
                            style={{
                              flex: 1,
                              color: colors.textPrimary,
                              fontSize: getFontSize(typography.sizes.bodySmall),
                              fontFamily: isSelected
                                ? typography.families.bodySemiBold
                                : typography.families.body,
                            }}
                          >
                            {option.label}
                          </Text>
                          <View
                            style={[
                              styles.radio,
                              { borderColor: isSelected ? colors.primary : colors.border },
                            ]}
                          >
                            {isSelected && (
                              <View
                                style={[styles.radioDot, { backgroundColor: colors.primary }]}
                              />
                            )}
                          </View>
                        </PressableScale>
                      );
                    })}
                  </View>

                  <View style={styles.secretRow}>
                    <Ionicons name="lock-closed" size={14} color={colors.textTertiary} />
                    <Text
                      style={{
                        flex: 1,
                        color: colors.textTertiary,
                        fontSize: getFontSize(typography.sizes.micro),
                        fontFamily: typography.families.body,
                        lineHeight: 16,
                      }}
                    >
                      {t('participation.consultations.secretNotice')}
                    </Text>
                  </View>

                  <Button
                    label={t('participation.consultations.submitVote')}
                    onPress={() => void deposerBulletin()}
                    disabled={!choix || isVoting}
                    haptic="success"
                    size="lg"
                  />
                </>
              )}

              {feuille.type === 'resultats' &&
                (resultats === null ? (
                  <View style={styles.resultsLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : (
                  <Animated.View entering={enterFade()} style={styles.results}>
                    {resultats.map((resultat, index) => {
                      const total = resultats.reduce((somme, r) => somme + r.votes, 0);
                      return (
                        <ProgressBar
                          key={resultat.optionId}
                          value={total > 0 ? Math.round((resultat.votes / total) * 100) : 0}
                          label={`${resultat.label} · ${resultat.votes}`}
                          delay={index * 120}
                        />
                      );
                    })}
                    <Text
                      style={{
                        color: colors.textTertiary,
                        fontSize: getFontSize(typography.sizes.caption),
                        fontFamily: typography.families.bodyMedium,
                        textAlign: 'center',
                      }}
                    >
                      {t('participation.consultations.totalVotes', {
                        count: resultats.reduce((somme, r) => somme + r.votes, 0),
                      })}
                    </Text>
                  </Animated.View>
                ))}
            </Animated.View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  banner: {
    height: 150,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  bannerContent: {
    padding: spacing.lg,
  },
  bannerTitle: {
    color: '#FFFFFF',
    marginBottom: 2,
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  votedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetQuestion: {
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  optionsSheet: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
  },
  secretRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  results: {
    gap: spacing.lg,
  },
  resultsLoading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
});
