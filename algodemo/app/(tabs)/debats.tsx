import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Screen, TAB_BAR_CLEARANCE } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { LiveDot } from '../../components/ui/LiveDot';
import { enterListItem, enterSection } from '../../components/ui/motion';
import { listDebates, type Debate } from '../../services/api/debats';
import {
  annulerRappel,
  listerRappels,
  preparerRappels,
  programmerRappel,
} from '../../services/rappels';
import { THEMATICS } from '../../constants/thematics';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  scrimGradient,
  scrimLocations,
  thematicGradients,
} from '../../constants/theme';

const BLURHASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

/** Dégradé de repli d'un débat sans couverture — celui de sa thématique. */
const gradientFor = (debate: Debate) => {
  const token =
    THEMATICS.find((thematic) => thematic.id === debate.thematicId)?.colorToken ??
    'politique';
  return thematicGradients[token];
};

/** « 16 août · 18:30 » — le format court des cartes. */
const formatDateHeure = (iso: string) => {
  const date = new Date(iso);
  return `${date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  })} · ${date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export default function DebatesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const insets = useSafeAreaInsets();

  const [debates, setDebates] = useState<Debate[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  /** Rappels programmés : debatId → identifiant de notification locale. */
  const [reminders, setReminders] = useState<Record<string, string>>({});

  const charger = useCallback(async () => {
    // Les notifications programmées sont la source de vérité des rappels :
    // rien à stocker nous-mêmes, donc rien à désynchroniser.
    listerRappels().then(setReminders).catch(() => {});
    try {
      setDebates(await listDebates());
      setHasError(false);
    } catch {
      setHasError(true);
    }
  }, []);

  const basculerRappel = useCallback(
    async (debate: Debate) => {
      const existant = reminders[debate.id];
      if (existant) {
        await annulerRappel(existant);
        setReminders((current) => {
          const { [debate.id]: _retire, ...reste } = current;
          return reste;
        });
        return;
      }

      const autorise = await preparerRappels();
      if (!autorise) {
        Alert.alert(t('debats.remindMe'), t('debats.notifDenied'));
        return;
      }

      const notificationId = await programmerRappel({
        id: debate.id,
        title: debate.title,
        startsAt: debate.startsAt,
        reminderTitle: t('debats.reminderTitle'),
        reminderBodySoon: t('debats.reminderBodySoon', { title: debate.title }),
        reminderBodyNow: t('debats.reminderBody', { title: debate.title }),
      });
      if (notificationId) {
        setReminders((current) => ({ ...current, [debate.id]: notificationId }));
      }
    },
    [reminders, t]
  );

  // Rechargé à chaque retour sur l'onglet : un direct démarré par l'admin
  // pendant qu'on était ailleurs apparaît dès qu'on revient.
  useFocusEffect(
    useCallback(() => {
      void charger();
    }, [charger])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  }, [charger]);

  const isLoading = debates === null && !hasError;

  // Plusieurs directs simultanés sont un cas nominal : tous affichés, dans le
  // même style — c'est la couverture choisie par l'admin qui les distingue.
  const lives = debates?.filter((debate) => debate.status === 'live') ?? [];
  const upcoming = (debates?.filter((debate) => debate.status === 'upcoming') ?? [])
    .slice()
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const ended = debates?.filter((debate) => debate.status === 'ended') ?? [];

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_CLEARANCE + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ─── En-tête ─────────────────────────────────────────────── */}
        <Animated.View entering={enterSection(0)} style={styles.header}>
          <View style={styles.brandRow}>
            <BrandLogo size={24} />
            <Text
              style={{
                color: colors.primary,
                fontSize: getFontSize(typography.sizes.bodySmall),
                fontFamily: typography.families.headingSemiBold,
              }}
            >
              {t('auth.brand.name')}
            </Text>
          </View>

          <Text
            style={[
              styles.title,
              {
                color: colors.textPrimary,
                fontSize: getFontSize(typography.sizes.h2),
                fontFamily: typography.families.heading,
              },
            ]}
          >
            {t('debats.title')}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: getFontSize(typography.sizes.bodySmall),
              fontFamily: typography.families.body,
              lineHeight: 19,
            }}
          >
            {t('debats.subtitle')}
          </Text>
        </Animated.View>

        {/* ─── En direct ───────────────────────────────────────────── */}
        <Animated.View entering={enterListItem(1)}>
          <SectionHeader
            title={t('debats.liveSection')}
            style={styles.sectionHeader}
          />
        </Animated.View>

        {isLoading && (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {hasError && !refreshing && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }, shadows.sm]}>
            <Ionicons name="cloud-offline-outline" size={22} color={colors.textTertiary} />
            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.body,
                },
              ]}
            >
              {t('debats.loadError')}
            </Text>
            <Button
              label={t('debats.retry')}
              onPress={() => void charger()}
              variant="outline"
              size="sm"
              haptic="light"
            />
          </View>
        )}

        {!isLoading && !hasError && lives.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }, shadows.sm]}>
            <Ionicons name="radio-outline" size={22} color={colors.textTertiary} />
            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.body,
                },
              ]}
            >
              {t('debats.noLive')}
            </Text>
          </View>
        )}

        {lives.map((live, index) => (
          <Animated.View
            key={live.id}
            entering={enterListItem(2 + index)}
            style={styles.liveBlock}
          >
            <PressableScale
              onPress={() =>
                router.push({ pathname: '/live-room', params: { id: live.id } })
              }
              scaleTo={motion.scale.card}
              haptic="medium"
              accessibilityRole="button"
              accessibilityLabel={`${live.title}. ${t('debats.live')}`}
              style={[styles.featuredCard, shadows.lg, { shadowColor: colors.primary }]}
            >
              {/* La couverture choisie par l'admin distingue ce live des
                  autres ; sans image, le dégradé de la thématique prend le
                  relais (jamais de bloc gris). */}
              {live.coverUrl ? (
                <Image
                  source={{ uri: live.coverUrl }}
                  placeholder={{ blurhash: BLURHASH }}
                  contentFit="cover"
                  transition={240}
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <LinearGradient
                  colors={gradientFor(live)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <LinearGradient
                colors={scrimGradient}
                locations={scrimLocations}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.featuredTop}>
                <LiveDot label={t('debats.live')} variant="overlay" />
                {live.thematicLabel && (
                  <View style={[styles.criticalBadge, { backgroundColor: colors.secondary }]}>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: getFontSize(typography.sizes.micro),
                        fontFamily: typography.families.bodyBold,
                      }}
                    >
                      {live.thematicLabel.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.featuredBottom}>
                <Text
                  numberOfLines={3}
                  style={[
                    styles.featuredTitle,
                    {
                      fontSize: getFontSize(typography.sizes.h3),
                      fontFamily: typography.families.heading,
                    },
                  ]}
                >
                  {live.title}
                </Text>

                {live.description ? (
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.featuredDescription,
                      {
                        fontSize: getFontSize(typography.sizes.caption),
                        fontFamily: typography.families.body,
                      },
                    ]}
                  >
                    {live.description}
                  </Text>
                ) : null}
              </View>
            </PressableScale>

            <Button
              label={t('debats.join')}
              onPress={() =>
                router.push({ pathname: '/live-room', params: { id: live.id } })
              }
              icon="play-circle"
              haptic="medium"
              size="lg"
              style={styles.joinButton}
            />
          </Animated.View>
        ))}

        {/* ─── Historique ──────────────────────────────────────────── */}
        {ended.length > 0 && (
          <>
            <Animated.View entering={enterListItem(3)}>
              <SectionHeader
                title={t('debats.historyTitle')}
                style={[styles.sectionHeader, styles.sectionSpacing]}
              />
            </Animated.View>

            {ended.map((debate, index) => (
              <Animated.View key={debate.id} entering={enterListItem(4 + index)}>
                <View
                  style={[
                    styles.replayCard,
                    { backgroundColor: colors.secondaryPale },
                    shadows.sm,
                  ]}
                >
                  <View style={styles.replayHeader}>
                    <View style={styles.replayLabelRow}>
                      <MaterialCommunityIcons
                        name="flag-checkered"
                        size={15}
                        color={colors.secondary}
                      />
                      <Text
                        style={{
                          color: colors.secondary,
                          fontSize: getFontSize(typography.sizes.micro),
                          fontFamily: typography.families.bodyBold,
                          letterSpacing: 0.6,
                        }}
                      >
                        {t('debats.ended').toUpperCase()}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: colors.textTertiary,
                        fontSize: getFontSize(typography.sizes.micro),
                        fontFamily: typography.families.body,
                      }}
                    >
                      {formatDateHeure(debate.startsAt)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.replayTitle,
                      {
                        color: colors.textPrimary,
                        fontSize: getFontSize(typography.sizes.body),
                        fontFamily: typography.families.headingSemiBold,
                      },
                    ]}
                  >
                    {debate.title}
                  </Text>

                  {debate.description ? (
                    <Text
                      numberOfLines={3}
                      style={[
                        styles.replaySummary,
                        {
                          color: colors.textSecondary,
                          fontSize: getFontSize(typography.sizes.bodySmall),
                          fontFamily: typography.families.body,
                        },
                      ]}
                    >
                      {debate.description}
                    </Text>
                  ) : (
                    <View style={styles.replaySpacer} />
                  )}

                  <View style={styles.replayFooter}>
                    <View style={styles.tags}>
                      {debate.thematicLabel && (
                        <View style={[styles.tag, { backgroundColor: colors.surface }]}>
                          <Text
                            style={{
                              color: colors.primary,
                              fontSize: getFontSize(typography.sizes.micro),
                              fontFamily: typography.families.bodyMedium,
                            }}
                          >
                            {debate.thematicLabel}
                          </Text>
                        </View>
                      )}
                    </View>

                    {debate.replayUrl && (
                      <PressableScale
                        onPress={() => void Linking.openURL(debate.replayUrl!)}
                        scaleTo={motion.scale.chip}
                        accessibilityRole="button"
                        accessibilityLabel={`${t('debats.listen')} — ${debate.title}`}
                        style={styles.listenButton}
                      >
                        <Ionicons name="play-circle" size={19} color={colors.secondary} />
                        <Text
                          style={{
                            color: colors.secondary,
                            fontSize: getFontSize(typography.sizes.caption),
                            fontFamily: typography.families.bodyBold,
                          }}
                        >
                          {t('debats.listen')}
                        </Text>
                      </PressableScale>
                    )}
                  </View>
                </View>
              </Animated.View>
            ))}
          </>
        )}

        {/* ─── Prochainement ───────────────────────────────────────── */}
        <Animated.View entering={enterListItem(5)}>
          <SectionHeader
            title={t('debats.upcomingTitle')}
            style={[styles.sectionHeader, styles.sectionSpacing]}
          />

          {upcoming.length === 0 && !isLoading && (
            <Text
              style={{
                color: colors.textTertiary,
                fontSize: getFontSize(typography.sizes.bodySmall),
                fontFamily: typography.families.body,
              }}
            >
              {t('debats.noUpcoming')}
            </Text>
          )}
        </Animated.View>

        {upcoming.map((debate, index) => (
          <Animated.View key={debate.id} entering={enterListItem(6 + index)}>
            <View style={[styles.upcomingCard, { backgroundColor: colors.surface }, shadows.md]}>
              <View style={[styles.upcomingDate, { backgroundColor: colors.primaryPale }]}>
                <Ionicons name="calendar-outline" size={22} color={colors.primary} />
              </View>

              <View style={styles.upcomingTexts}>
                <Text
                  style={{
                    color: colors.primaryMedium,
                    fontSize: getFontSize(typography.sizes.micro),
                    fontFamily: typography.families.bodyBold,
                    letterSpacing: 0.6,
                  }}
                >
                  {(debate.thematicLabel ?? t('debats.upcoming')).toUpperCase()}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.upcomingTitle,
                    {
                      color: colors.textPrimary,
                      fontSize: getFontSize(typography.sizes.bodySmall),
                      fontFamily: typography.families.headingSemiBold,
                    },
                  ]}
                >
                  {debate.title}
                </Text>
                <Text
                  style={{
                    color: colors.textTertiary,
                    fontSize: getFontSize(typography.sizes.micro),
                    fontFamily: typography.families.body,
                  }}
                >
                  {formatDateHeure(debate.startsAt)}
                </Text>
              </View>

              <Button
                label={
                  reminders[debate.id]
                    ? t('debats.reminderSet')
                    : t('debats.remindMe')
                }
                onPress={() => void basculerRappel(debate)}
                variant={reminders[debate.id] ? 'primary' : 'outline'}
                icon={reminders[debate.id] ? 'notifications' : 'notifications-outline'}
                size="sm"
                haptic="light"
              />
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    marginBottom: spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionSpacing: {
    marginTop: spacing.xl,
  },
  loadingBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 19,
  },
  liveBlock: {
    marginBottom: spacing.lg,
  },
  featuredCard: {
    height: 260,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  featuredTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  criticalBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    flexShrink: 1,
  },
  featuredBottom: {},
  featuredTitle: {
    color: '#FFFFFF',
    lineHeight: 27,
  },
  featuredDescription: {
    color: 'rgba(255, 255, 255, 0.82)',
    lineHeight: 17,
    marginTop: spacing.sm,
  },
  joinButton: {
    marginTop: spacing.md,
  },
  replayCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  replayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  replayLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  replayTitle: {
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  replaySummary: {
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  replaySpacer: {
    height: spacing.md,
  },
  replayFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  tags: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexShrink: 1,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  upcomingDate: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingTexts: {
    flex: 1,
  },
  upcomingTitle: {
    lineHeight: 18,
    marginVertical: 2,
  },
});
