import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { useAuthStore } from '../../../stores/authStore';
import { Button } from '../../../components/ui/Button';
import { PressableScale } from '../../../components/ui/PressableScale';
import { TAB_BAR_CLEARANCE } from '../../../components/ui/Screen';
import { enterListItem, enterSheet } from '../../../components/ui/motion';
import { StatusPill } from '../../../components/feature/participation/StatusPill';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  withAlpha,
} from '../../../constants/theme';

interface Sondage {
  id: string;
  title: string;
  description: string;
  thematicLabel: string;
  endDate: string;
  isOpen: boolean;
  options: string[];
}

// TODO(backend) : remplacer par GET /sondages
const MOCK_SONDAGES: Sondage[] = [
  {
    id: 'sondage_1',
    title: 'Plan de solarisation des toits communaux',
    description:
      'Votez pour le déploiement prioritaire des panneaux photovoltaïques sur les établissements publics de la zone sud.',
    thematicLabel: 'Transition énergétique',
    endDate: '15 Sept.',
    isOpen: true,
    options: ['Oui, tout à fait', "Non, c'est trop coûteux", 'Mitigé'],
  },
  {
    id: 'sondage_2',
    title: 'Extension de la zone cyclable Nord-Ouest',
    description:
      'Consultation terminée. Les résultats sont en cours d’analyse par la commission de développement urbain.',
    thematicLabel: 'Mobilités',
    endDate: '01 Août',
    isOpen: false,
    options: ['Oui, indispensable', 'Non, inutile'],
  },
  {
    id: 'sondage_3',
    title: 'Implantation de cabinets pluridisciplinaires en centre-ville',
    description:
      'Donnez votre avis sur la réponse à apporter à la désertification médicale locale.',
    thematicLabel: 'Santé publique',
    endDate: '22 Sept.',
    isOpen: true,
    options: ['Favorable', 'Défavorable', 'Sans opinion'],
  },
];

export default function SondagesScreen() {
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const { isAuthenticated } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [selected, setSelected] = useState<Sondage | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  // RG-CON-04 / Correction #3 : un vote par consultation, bouton neutralisé ensuite.
  const [votes, setVotes] = useState<Record<string, string>>({});

  const openSondage = (item: Sondage) => {
    setSelected(item);
    setChoice(votes[item.id] ?? null);
  };

  const submitVote = () => {
    if (!selected || !choice) return;
    setVotes((current) => ({ ...current, [selected.id]: choice }));
    setSelected(null);
  };

  return (
    <>
      <FlatList
        data={MOCK_SONDAGES}
        keyExtractor={(item) => item.id}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_CLEARANCE + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const hasVoted = !!votes[item.id];
          return (
            <Animated.View entering={enterListItem(index)}>
              <View style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}>
                <View style={styles.cardHeader}>
                  <StatusPill
                    label={
                      item.isOpen
                        ? t('participation.status.open')
                        : t('participation.status.closed')
                    }
                    tone={item.isOpen ? 'open' : 'closed'}
                    pulse={item.isOpen}
                  />
                  <Text
                    style={{
                      color: colors.textTertiary,
                      fontSize: getFontSize(typography.sizes.micro),
                      fontFamily: typography.families.bodyMedium,
                    }}
                  >
                    {item.isOpen
                      ? t('participation.status.closesOn', { date: item.endDate })
                      : t('participation.status.closed')}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.thematic,
                    {
                      color: colors.textTertiary,
                      fontSize: getFontSize(typography.sizes.micro),
                      fontFamily: typography.families.bodyBold,
                    },
                  ]}
                >
                  {item.thematicLabel.toUpperCase()}
                </Text>

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
                  {item.description}
                </Text>

                <Button
                  label={
                    !item.isOpen
                      ? t('participation.sondages.voteClosed')
                      : hasVoted
                        ? t('participation.sondages.voted')
                        : t('participation.sondages.vote')
                  }
                  onPress={() => openSondage(item)}
                  disabled={!item.isOpen || hasVoted}
                  variant={hasVoted ? 'outline' : 'primary'}
                  icon={hasVoted ? 'checkmark-circle' : undefined}
                  haptic="medium"
                />
              </View>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bar-chart-outline" size={44} color={colors.textTertiary} />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: getFontSize(typography.sizes.bodySmall),
                fontFamily: typography.families.body,
              }}
            >
              {t('participation.sondages.empty')}
            </Text>
          </View>
        }
      />

      {/* ─── Feuille de vote ────────────────────────────────────────── */}
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          {selected && (
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
                  {t('participation.sondages.modalTitle')}
                </Text>
                <PressableScale
                  onPress={() => setSelected(null)}
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
                    color: colors.textPrimary,
                    fontSize: getFontSize(typography.sizes.body),
                    fontFamily: typography.families.bodySemiBold,
                  },
                ]}
              >
                {selected.title}
              </Text>

              {/* Correction #4 : le vote porte toujours sur une option existante. */}
              <View style={styles.options}>
                {selected.options.map((option) => (
                  <VoteOption
                    key={option}
                    label={option}
                    isSelected={choice === option}
                    onPress={() => setChoice(option)}
                  />
                ))}
              </View>

              <View style={styles.notice}>
                <Ionicons name="lock-closed" size={14} color={colors.textTertiary} />
                <Text
                  style={{
                    flex: 1,
                    color: colors.textTertiary,
                    fontSize: getFontSize(typography.sizes.caption),
                    fontFamily: typography.families.body,
                  }}
                >
                  {t('participation.sondages.anonymousNotice')}
                </Text>
              </View>

              <Button
                label={t('participation.sondages.submitVote')}
                onPress={submitVote}
                disabled={!choice || !isAuthenticated}
                haptic="success"
                size="lg"
              />
            </Animated.View>
          )}
        </View>
      </Modal>
    </>
  );
}

// ─── Option de vote ─────────────────────────────────────────────────
const VoteOption: React.FC<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ label, isSelected, onPress }) => {
  const { colors, getFontSize } = useAccessibility();
  const progress = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(isSelected ? 1 : 0, { duration: motion.durations.base });
  }, [isSelected, progress]);

  // Les bornes de couleur sont calculées sur le thread JS : un worklet ne peut
  // pas appeler une fonction JS ordinaire, et refaire cette conversion à
  // chaque frame serait de toute façon inutile.
  const selectedBackground = withAlpha(colors.primary, 0.06);

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.value, [0, 1], [colors.border, colors.primary]),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.surface, selectedBackground]
    ),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isSelected ? 1 : 0, motion.bounce) }],
  }));

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.option, containerStyle]}>
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
          {label}
        </Text>
        <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border }]}>
          <Animated.View style={[styles.radioDot, { backgroundColor: colors.primary }, dotStyle]} />
        </View>
      </Animated.View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
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
  thematic: {
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    lineHeight: 19,
    marginBottom: spacing.lg,
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
    marginBottom: spacing.lg,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetQuestion: {
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  options: {
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
    width: 22,
    height: 22,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: borderRadius.full,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
});
