import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
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
import { SectionHeader } from '../../components/ui/SectionHeader';
import { LiveDot } from '../../components/ui/LiveDot';
import { enterListItem, enterSection } from '../../components/ui/motion';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  scrimGradient,
  scrimLocations,
  withAlpha,
} from '../../constants/theme';

const BLURHASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

// TODO(backend) : remplacer par GET /debats (direct, replays, programmation).
const FEATURED = {
  title: "Régulation de l'IA : souveraineté ou innovation ?",
  speakers: 'Dr. Sarah L. & Marc V.',
  viewers: 1200,
  cover: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?q=80&w=1000',
};

const REPLAYS = [
  {
    id: 'replay_1',
    title: 'Transition écologique : le rôle du nucléaire',
    summary:
      "Le débat a mis en évidence un consensus sur la nécessité d'un mix énergétique, tout en soulignant les divergences sur le stockage des déchets.",
    date: 'Hier, 18:30',
    tags: ['Énergie', 'Futur'],
  },
  {
    id: 'replay_2',
    title: 'Accès aux soins en zone rurale',
    summary:
      'Les participants ont proposé trois leviers majeurs : la télémédecine assistée, les maisons de santé pluridisciplinaires et la revalorisation des carrières.',
    date: '24 Oct.',
    tags: ['Santé', 'Territoires'],
  },
];

const UPCOMING = {
  title: 'Le travail en 2050 : la fin du salariat ?',
  date: '12 Août · 18 h 00',
};

export default function DebatesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const insets = useSafeAreaInsets();

  const formattedViewers =
    FEATURED.viewers >= 1000
      ? `${(FEATURED.viewers / 1000).toFixed(1).replace('.', ',')} k`
      : String(FEATURED.viewers);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_CLEARANCE + insets.bottom },
        ]}
      >
        {/* ─── En-tête ─────────────────────────────────────────────── */}
        <Animated.View entering={enterSection(0)} style={styles.header}>
          <View style={styles.brandRow}>
            <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="scale-balance" size={15} color={colors.textInverse} />
            </View>
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

        {/* ─── Direct en vedette ───────────────────────────────────── */}
        <Animated.View entering={enterListItem(1)}>
          <SectionHeader title={t('debats.featured')} style={styles.sectionHeader} />

          <PressableScale
            onPress={() => router.push('/live-room')}
            scaleTo={motion.scale.card}
            haptic="medium"
            accessibilityRole="button"
            accessibilityLabel={`${FEATURED.title}. ${t('debats.live')}`}
            style={[styles.featuredCard, shadows.lg, { shadowColor: colors.primary }]}
          >
            <Image
              source={{ uri: FEATURED.cover }}
              placeholder={{ blurhash: BLURHASH }}
              contentFit="cover"
              transition={240}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={scrimGradient}
              locations={scrimLocations}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.featuredTop}>
              <LiveDot label={t('debats.live')} variant="overlay" />
              <View style={[styles.criticalBadge, { backgroundColor: colors.secondary }]}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: getFontSize(typography.sizes.micro),
                    fontFamily: typography.families.bodyBold,
                  }}
                >
                  {t('debats.critical').toUpperCase()}
                </Text>
              </View>
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
                {FEATURED.title}
              </Text>

              <View style={styles.featuredMeta}>
                <View style={styles.speakerBlock}>
                  <Text
                    style={[
                      styles.metaLabel,
                      {
                        fontSize: getFontSize(typography.sizes.micro),
                        fontFamily: typography.families.bodyMedium,
                      },
                    ]}
                  >
                    {t('debats.speakers')}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.metaValue,
                      {
                        fontSize: getFontSize(typography.sizes.caption),
                        fontFamily: typography.families.bodySemiBold,
                      },
                    ]}
                  >
                    {FEATURED.speakers}
                  </Text>
                </View>

                <View style={[styles.viewersChip, { backgroundColor: withAlpha('#000000', 0.4) }]}>
                  <Ionicons name="eye-outline" size={13} color="#FFFFFF" />
                  <Text
                    style={[
                      styles.metaValue,
                      {
                        fontSize: getFontSize(typography.sizes.micro),
                        fontFamily: typography.families.bodySemiBold,
                      },
                    ]}
                  >
                    {t('debats.viewers', { value: formattedViewers })}
                  </Text>
                </View>
              </View>
            </View>
          </PressableScale>

          <Button
            label={t('debats.join')}
            onPress={() => router.push('/live-room')}
            icon="play-circle"
            haptic="medium"
            size="lg"
            style={styles.joinButton}
          />
        </Animated.View>

        {/* ─── Replays et résumés ──────────────────────────────────── */}
        <Animated.View entering={enterListItem(2)}>
          <SectionHeader title={t('debats.historyTitle')} style={styles.sectionHeader} />
        </Animated.View>

        {REPLAYS.map((replay, index) => (
          <Animated.View key={replay.id} entering={enterListItem(3 + index)}>
            <View
              style={[
                styles.replayCard,
                { backgroundColor: colors.secondaryPale },
                shadows.sm,
              ]}
            >
              <View style={styles.replayHeader}>
                <View style={styles.replayLabelRow}>
                  <MaterialCommunityIcons name="creation" size={15} color={colors.secondary} />
                  <Text
                    style={{
                      color: colors.secondary,
                      fontSize: getFontSize(typography.sizes.micro),
                      fontFamily: typography.families.bodyBold,
                      letterSpacing: 0.6,
                    }}
                  >
                    {t('debats.aiSummary').toUpperCase()}
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.textTertiary,
                    fontSize: getFontSize(typography.sizes.micro),
                    fontFamily: typography.families.body,
                  }}
                >
                  {replay.date}
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
                {replay.title}
              </Text>

              <Text
                style={[
                  styles.replaySummary,
                  {
                    color: colors.textSecondary,
                    fontSize: getFontSize(typography.sizes.bodySmall),
                    fontFamily: typography.families.body,
                  },
                ]}
              >
                {replay.summary}
              </Text>

              <View style={styles.replayFooter}>
                <View style={styles.tags}>
                  {replay.tags.map((tag) => (
                    <View
                      key={tag}
                      style={[styles.tag, { backgroundColor: colors.surface }]}
                    >
                      <Text
                        style={{
                          color: colors.primary,
                          fontSize: getFontSize(typography.sizes.micro),
                          fontFamily: typography.families.bodyMedium,
                        }}
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>

                <PressableScale
                  onPress={() => {
                    /* TODO(backend) : lecture du résumé audio du débat */
                  }}
                  scaleTo={motion.scale.chip}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('debats.listen')} — ${replay.title}`}
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
              </View>
            </View>
          </Animated.View>
        ))}

        {/* ─── Prochainement ───────────────────────────────────────── */}
        <Animated.View entering={enterListItem(5)}>
          <SectionHeader title={t('debats.upcomingTitle')} style={styles.sectionHeader} />

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
                {t('debats.upcoming').toUpperCase()}
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
                {UPCOMING.title}
              </Text>
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: getFontSize(typography.sizes.micro),
                  fontFamily: typography.families.body,
                }}
              >
                {UPCOMING.date}
              </Text>
            </View>

            <Button
              label={t('debats.remindMe')}
              onPress={() => {
                /* TODO(backend) : abonnement au rappel de démarrage du débat */
              }}
              variant="outline"
              size="sm"
              haptic="light"
            />
          </View>
        </Animated.View>
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
  brandMark: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    marginBottom: spacing.md,
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
  },
  featuredBottom: {},
  featuredTitle: {
    color: '#FFFFFF',
    lineHeight: 27,
    marginBottom: spacing.md,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  speakerBlock: {
    flex: 1,
  },
  metaLabel: {
    color: 'rgba(255, 255, 255, 0.62)',
    marginBottom: 1,
  },
  metaValue: {
    color: '#FFFFFF',
  },
  viewersChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  joinButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
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
    marginTop: spacing.xs,
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
