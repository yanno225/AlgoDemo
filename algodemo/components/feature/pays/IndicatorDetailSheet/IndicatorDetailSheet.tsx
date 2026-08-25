import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import * as Speech from 'expo-speech';
import { dire } from '../../../../services/voix';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAccessibility } from '../../../../hooks/useAccessibility';
import { PressableScale } from '../../../ui/PressableScale';
import { enterSheet } from '../../../ui/motion';
import {
  CountryIndicator,
  latestValue,
  latestDelta,
} from '../../../../constants/countryProfile';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  withAlpha,
  onThematic,
  thematicInk,
} from '../../../../constants/theme';

interface IndicatorDetailSheetProps {
  /** Indicateur affiché, ou `null` pour masquer la feuille. */
  indicator: CountryIndicator | null;
  /** Couleur de la thématique parente. */
  color: string;
  onClose: () => void;
}

const CHART_WIDTH = 280;
const CHART_HEIGHT = 96;

/**
 * Détail d'un indicateur de la fiche pays.
 *
 * Ouvert au toucher d'une jauge, il donne ce que la jauge seule ne peut pas
 * montrer : l'évolution dans le temps, la source de chaque mesure et le sens
 * de la tendance. La courbe se lit d'un coup ; la liste datée donne la preuve.
 */
export const IndicatorDetailSheet: React.FC<IndicatorDetailSheetProps> = ({
  indicator,
  color,
  onClose,
}) => {
  const { colors, getFontSize } = useAccessibility();
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Les teintes claires de la palette FID (sable, jaune) restent la couleur
  // d'accent, mais l'encre des textes et le contenu posé dessus s'adaptent.
  const ink = thematicInk(color);
  const onColor = onThematic(color);

  const value = indicator ? latestValue(indicator) : 0;
  const delta = indicator ? latestDelta(indicator) : null;

  // Une hausse est favorable ou non selon la nature de l'indicateur.
  const isImproving =
    delta === null || !indicator
      ? null
      : indicator.goodDirection === 'up'
        ? delta >= 0
        : delta <= 0;

  const stopSpeech = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const handleSpeak = () => {
    if (!indicator) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSpeaking) {
      stopSpeech();
      return;
    }
    setIsSpeaking(true);
    const trend =
      delta === null
        ? ''
        : ` Tendance : ${delta >= 0 ? 'en hausse' : 'en baisse'} de ${Math.abs(delta)} points.`;
    void dire(
      `${indicator.labelKey}. ${value}${indicator.unit}. ${indicator.description}${trend}`,
      { onDone: () => setIsSpeaking(false), onStopped: () => setIsSpeaking(false) }
    );
  };

  // Couper la lecture dès la fermeture — jamais de voix orpheline.
  useEffect(() => {
    if (!indicator) stopSpeech();
    return () => {
      Speech.stop();
    };
  }, [indicator]);

  if (!indicator) return null;

  const deltaTone =
    isImproving === null ? colors.textTertiary : isImproving ? colors.success : colors.error;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        {/* Un appui hors de la feuille ferme. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />

        <Animated.View
          entering={enterSheet()}
          style={[styles.sheet, { backgroundColor: colors.surface }, shadows.lg]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* ─── En-tête ───────────────────────────────────────────── */}
            <View style={styles.header}>
              <View style={styles.headerText}>
                <View style={[styles.domainDot, { backgroundColor: color }]} />
                <Text
                  style={[
                    styles.title,
                    {
                      color: colors.textPrimary,
                      fontSize: getFontSize(typography.sizes.h4),
                      fontFamily: typography.families.headingSemiBold,
                    },
                  ]}
                >
                  {indicator.labelKey}
                </Text>
              </View>
              <PressableScale
                onPress={onClose}
                scaleTo={motion.scale.chip}
                accessibilityRole="button"
                accessibilityLabel="Fermer le détail"
                style={[styles.close, { backgroundColor: colors.surfaceElevated }]}
              >
                <Ionicons name="close" size={19} color={colors.textSecondary} />
              </PressableScale>
            </View>

            <Text
              style={[
                styles.description,
                {
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.body,
                },
              ]}
            >
              {indicator.description}
            </Text>

            {/* ─── Valeur courante + tendance ────────────────────────── */}
            <View style={styles.valueRow}>
              <Text
                style={[
                  styles.value,
                  {
                    color: ink,
                    fontSize: getFontSize(typography.sizes.h1) + 8,
                    fontFamily: typography.families.heading,
                  },
                ]}
              >
                {value}
                <Text style={{ fontSize: getFontSize(typography.sizes.h3) }}>{indicator.unit}</Text>
              </Text>

              {delta !== null && (
                <View style={[styles.deltaChip, { backgroundColor: withAlpha(deltaTone, 0.12) }]}>
                  <Ionicons
                    name={delta >= 0 ? 'trending-up' : 'trending-down'}
                    size={15}
                    color={deltaTone}
                  />
                  <Text
                    style={{
                      color: deltaTone,
                      fontSize: getFontSize(typography.sizes.caption),
                      fontFamily: typography.families.bodyBold,
                    }}
                  >
                    {delta >= 0 ? '+' : ''}
                    {delta} pts
                  </Text>
                </View>
              )}
            </View>

            {/* ─── Courbe d'évolution ────────────────────────────────── */}
            <EvolutionChart history={indicator.history} color={color} />

            {/* ─── Mesures datées ────────────────────────────────────── */}
            <Text
              style={[
                styles.sectionLabel,
                {
                  color: colors.textTertiary,
                  fontSize: getFontSize(typography.sizes.micro),
                  fontFamily: typography.families.bodyBold,
                },
              ]}
            >
              {'Historique des mesures'.toUpperCase()}
            </Text>

            <View style={styles.measures}>
              {indicator.history.map((entry, index) => {
                const year = entry.dateMesure.slice(0, 4);
                return (
                  <Animated.View
                    key={entry.dateMesure}
                    entering={FadeIn.delay(index * 60).duration(motion.durations.base)}
                    style={[
                      styles.measureRow,
                      index < indicator.history.length - 1 && {
                        borderBottomColor: colors.borderLight,
                        borderBottomWidth: 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.measureYear,
                        {
                          color: colors.textPrimary,
                          fontSize: getFontSize(typography.sizes.bodySmall),
                          fontFamily: typography.families.bodyBold,
                        },
                      ]}
                    >
                      {year}
                    </Text>
                    <Text
                      style={[
                        styles.measureValue,
                        { color: ink, fontSize: getFontSize(typography.sizes.body), fontFamily: typography.families.headingSemiBold },
                      ]}
                    >
                      {entry.valeur}
                      {indicator.unit}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.measureSource,
                        {
                          color: colors.textTertiary,
                          fontSize: getFontSize(typography.sizes.micro),
                          fontFamily: typography.families.body,
                        },
                      ]}
                    >
                      {entry.source}
                    </Text>
                  </Animated.View>
                );
              })}
            </View>

            {/* ─── Lecture audio (accessibilité, RG-FEED-05) ─────────── */}
            <PressableScale
              onPress={handleSpeak}
              haptic="none"
              accessibilityRole="button"
              accessibilityLabel={isSpeaking ? 'Arrêter la lecture' : 'Écouter le détail'}
              style={[
                styles.audioButton,
                {
                  backgroundColor: isSpeaking ? color : withAlpha(color, 0.1),
                  borderColor: withAlpha(color, 0.3),
                },
              ]}
            >
              <Ionicons
                name={isSpeaking ? 'stop' : 'volume-high'}
                size={18}
                color={isSpeaking ? onColor : ink}
              />
              <Text
                style={{
                  color: isSpeaking ? onColor : ink,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.bodySemiBold,
                }}
              >
                {isSpeaking ? 'Arrêter' : 'Écouter'}
              </Text>
            </PressableScale>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─── Courbe d'évolution en SVG ──────────────────────────────────────
const EvolutionChart: React.FC<{
  history: CountryIndicator['history'];
  color: string;
}> = ({ history, color }) => {
  const { colors } = useAccessibility();

  // La courbe se lit dans le sens du temps : du plus ancien au plus récent.
  const chrono = [...history].reverse();
  if (chrono.length < 2) return null;

  const values = chrono.map((entry) => entry.valeur);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padX = 10;
  const padY = 14;

  const points = chrono.map((entry, index) => {
    const x = padX + (index / (chrono.length - 1)) * (CHART_WIDTH - padX * 2);
    const y =
      CHART_HEIGHT - padY - ((entry.valeur - min) / range) * (CHART_HEIGHT - padY * 2);
    return { x, y };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View style={styles.chart}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Ligne de base discrète. */}
        <Line
          x1={padX}
          y1={CHART_HEIGHT - padY}
          x2={CHART_WIDTH - padX}
          y2={CHART_HEIGHT - padY}
          stroke={colors.borderLight}
          strokeWidth={1}
        />
        <Polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, index) => (
          <Circle
            key={index}
            cx={p.x}
            cy={p.y}
            r={index === points.length - 1 ? 4.5 : 3}
            fill={index === points.length - 1 ? color : colors.surface}
            stroke={color}
            strokeWidth={2}
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    maxHeight: '86%',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  domainDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    flex: 1,
    lineHeight: 26,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  value: {
    letterSpacing: -1,
  },
  deltaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  chart: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  measures: {},
  measureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  measureYear: {
    width: 48,
  },
  measureValue: {
    width: 64,
  },
  measureSource: {
    flex: 1,
    textAlign: 'right',
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
});

export default IndicatorDetailSheet;
