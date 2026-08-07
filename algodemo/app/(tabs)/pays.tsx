import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Screen, TAB_BAR_CLEARANCE } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { IndicatorDetailSheet } from '../../components/feature/pays/IndicatorDetailSheet';
import { enterSection, enterListItem } from '../../components/ui/motion';
import {
  COTE_DIVOIRE,
  DomainId,
  CountryDomain,
  CountryIndicator,
  latestValue,
  latestSource,
} from '../../constants/countryProfile';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  withAlpha,
  onThematic,
} from '../../constants/theme';

export default function CountryProfileScreen() {
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const insets = useSafeAreaInsets();

  const profile = COTE_DIVOIRE;
  const [activeDomainId, setActiveDomainId] = useState<DomainId>(profile.domains[0].id);

  // Indicateur dont on affiche le détail, et couleur de sa thématique.
  const [selected, setSelected] = useState<{
    indicator: CountryIndicator;
    color: string;
  } | null>(null);

  const activeDomain = useMemo(
    () => profile.domains.find((d) => d.id === activeDomainId) ?? profile.domains[0],
    [activeDomainId, profile.domains]
  );

  return (
    <Screen>
      {/* ─── En-tête ───────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <BrandLogo size={24} />
          <Text
            style={{
              color: colors.primary,
              fontSize: getFontSize(typography.sizes.bodySmall),
              fontFamily: typography.families.headingSemiBold,
            }}
          >
            AlgoDémo
          </Text>
        </View>

        {/* Sélecteur de pays — un seul disponible pour le pilote. */}
        <PressableScale
          onPress={() => {
            /* TODO(backend) : ouverture du sélecteur multi-pays */
          }}
          scaleTo={motion.scale.chip}
          accessibilityRole="button"
          accessibilityLabel={t('pays.selectCountry')}
          style={[styles.countryChip, { backgroundColor: colors.surface }, shadows.sm]}
        >
          <Text style={styles.flag}>{profile.flag}</Text>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: getFontSize(typography.sizes.bodySmall),
              fontFamily: typography.families.bodySemiBold,
            }}
          >
            {profile.name}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </PressableScale>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_CLEARANCE + insets.bottom },
        ]}
      >
        <Animated.View entering={enterSection(0)}>
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
            {t('pays.title')}
          </Text>
          <Text
            style={{
              color: colors.textTertiary,
              fontSize: getFontSize(typography.sizes.caption),
              fontFamily: typography.families.body,
              fontStyle: 'italic',
              marginTop: 2,
            }}
          >
            {t('pays.updatedAt', { date: profile.updatedAt })}
          </Text>
        </Animated.View>

        {/* ─── Synthèse IA ─────────────────────────────────────────── */}
        <Animated.View
          entering={enterListItem(1)}
          style={[styles.synthCard, { backgroundColor: colors.primaryPale }]}
        >
          <View style={styles.synthHeader}>
            <MaterialCommunityIcons name="creation" size={16} color={colors.primary} />
            <Text
              style={{
                color: colors.primary,
                fontSize: getFontSize(typography.sizes.caption),
                fontFamily: typography.families.bodyBold,
              }}
            >
              {t('pays.aiSynthesisLabel')}
            </Text>
          </View>

          <Text
            style={[
              styles.synthText,
              {
                color: colors.textPrimary,
                fontSize: getFontSize(typography.sizes.bodySmall),
                fontFamily: typography.families.body,
              },
            ]}
          >
            {profile.aiSynthesis}
          </Text>

          <Text
            style={{
              color: colors.textTertiary,
              fontSize: getFontSize(typography.sizes.micro),
              fontFamily: typography.families.bodyMedium,
              marginTop: spacing.sm,
              letterSpacing: 0.4,
            }}
          >
            {t('pays.aiSynthesisNote', { count: profile.sourceCount }).toUpperCase()}
          </Text>
        </Animated.View>

        {/* ─── Sélecteur de domaine ────────────────────────────────── */}
        <Animated.View entering={enterListItem(2)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pills}
          >
            {profile.domains.map((domain) => (
              <DomainPill
                key={domain.id}
                label={t(`pays.domains.${domain.id}`)}
                color={colors.thematic[domain.colorToken]}
                isActive={domain.id === activeDomainId}
                onPress={() => setActiveDomainId(domain.id)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ─── Indicateurs du domaine actif ────────────────────────── */}
        <DomainSection
          key={activeDomain.id}
          domain={activeDomain}
          color={colors.thematic[activeDomain.colorToken]}
          onSelect={(indicator, color) => setSelected({ indicator, color })}
        />

        <Button
          label={t('pays.sources')}
          variant="outline"
          icon="document-text-outline"
          haptic="light"
          onPress={() => {
            /* TODO(backend) : ouverture de la liste détaillée des sources */
          }}
          style={styles.sourcesButton}
        />

        {/* ─── Le saviez-vous ? ────────────────────────────────────── */}
        <Animated.View
          entering={enterListItem(4)}
          style={[styles.factCard, { backgroundColor: colors.secondaryPale }]}
        >
          <View style={[styles.factIcon, { backgroundColor: withAlpha(colors.secondary, 0.18) }]}>
            <MaterialCommunityIcons name="lightbulb-on" size={18} color={colors.secondary} />
          </View>
          <View style={styles.factBody}>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: getFontSize(typography.sizes.bodySmall),
                fontFamily: typography.families.bodyBold,
                marginBottom: 2,
              }}
            >
              {t('pays.didYouKnow')}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: getFontSize(typography.sizes.caption),
                fontFamily: typography.families.body,
                lineHeight: 18,
              }}
            >
              {profile.didYouKnow}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Détail de l'indicateur touché : évolution, sources, tendance. */}
      <IndicatorDetailSheet
        indicator={selected?.indicator ?? null}
        color={selected?.color ?? colors.primary}
        onClose={() => setSelected(null)}
      />
    </Screen>
  );
}

// ─── Section d'un domaine ───────────────────────────────────────────
// Isolée dans son composant, montée avec une `key` liée au domaine : changer
// de domaine la remonte, ce qui relance l'animation des anneaux depuis zéro.
const DomainSection: React.FC<{
  domain: CountryDomain;
  color: string;
  onSelect: (indicator: CountryIndicator, color: string) => void;
}> = ({ domain, color, onSelect }) => {
  const { colors, getFontSize } = useAccessibility();

  return (
    <Animated.View entering={enterSection(40)}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionDot, { backgroundColor: color }]} />
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: getFontSize(typography.sizes.body),
            fontFamily: typography.families.headingSemiBold,
          }}
        >
          {domain.sectionTitleKey}
        </Text>
      </View>

      <View style={styles.grid}>
        {domain.indicators.map((indicator, index) => (
          <PressableScale
            key={indicator.id}
            onPress={() => onSelect(indicator, color)}
            scaleTo={motion.scale.card}
            accessibilityRole="button"
            accessibilityLabel={`${indicator.labelKey} : ${latestValue(indicator)}${indicator.unit}. Voir le détail`}
            style={[styles.gaugeCard, { backgroundColor: colors.surface }, shadows.sm]}
          >
            <CircularProgress
              percentage={latestValue(indicator)}
              label={indicator.labelKey}
              color={color}
              size={84}
              strokeWidth={8}
              delay={120 + index * 110}
              hideLabel
            />
            <Text
              numberOfLines={2}
              style={[
                styles.gaugeLabel,
                {
                  color: colors.textPrimary,
                  fontSize: getFontSize(typography.sizes.caption),
                  fontFamily: typography.families.bodySemiBold,
                },
              ]}
            >
              {indicator.labelKey}
            </Text>
            <Text
              numberOfLines={2}
              style={[
                styles.gaugeSource,
                {
                  color: colors.textTertiary,
                  fontSize: getFontSize(typography.sizes.micro),
                  fontFamily: typography.families.body,
                },
              ]}
            >
              {latestSource(indicator)}
            </Text>

            {/* Repère d'affordance : la carte s'ouvre. */}
            <View style={styles.gaugeChevron}>
              <Ionicons name="chevron-forward" size={13} color={colors.textTertiary} />
            </View>
          </PressableScale>
        ))}
      </View>
    </Animated.View>
  );
};

// ─── Pastille de domaine ────────────────────────────────────────────
const DomainPill: React.FC<{
  label: string;
  color: string;
  isActive: boolean;
  onPress: () => void;
}> = ({ label, color, isActive, onPress }) => {
  const { colors, getFontSize } = useAccessibility();
  const progress = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, { duration: motion.durations.base });
  }, [isActive, progress]);

  // Encre du texte actif calculée hors worklet : les teintes claires de la
  // palette FID (sable) exigent une encre sombre à la place du blanc.
  const activeInk = onThematic(color);

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.surface, color]),
    borderColor: interpolateColor(progress.value, [0, 1], [colors.border, color]),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [colors.textSecondary, activeInk]),
  }));

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={motion.scale.chip}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.pill, pillStyle]}>
        <Animated.Text
          style={[
            {
              fontSize: getFontSize(typography.sizes.bodySmall),
              fontFamily: isActive
                ? typography.families.bodyBold
                : typography.families.bodyMedium,
            },
            textStyle,
          ]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  flag: {
    fontSize: 16,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.lg,
  },
  title: {},
  synthCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  synthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  synthText: {
    lineHeight: 20,
  },
  pills: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gaugeCard: {
    // Deux colonnes : (100% - gap) / 2. Le gap vaut spacing.md (12).
    width: '47.5%',
    flexGrow: 1,
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  gaugeChevron: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  gaugeLabel: {
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 17,
  },
  gaugeSource: {
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 13,
  },
  sourcesButton: {
    marginTop: spacing.xs,
  },
  factCard: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  factIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  factBody: {
    flex: 1,
  },
});
