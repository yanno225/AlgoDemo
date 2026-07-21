import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../../../../hooks/useAccessibility';
import { useFilterStore } from '../../../../stores/filterStore';
import { THEMATICS } from '../../../../constants/thematics';
import { spacing, typography, borderRadius, motion, withAlpha } from '../../../../constants/theme';
import { PressableScale } from '../../../ui/PressableScale';

const getThematicEmoji = (id: string): string => {
  switch (id) {
    case 'genre_societe':
      return '🎭';
    case 'jeunesse_societe':
      return '🧒';
    case 'droit':
      return '⚖️';
    case 'politique':
      return '🏛️';
    case 'societe_vivant':
      return '🌍';
    default:
      return '📰';
  }
};

export interface ThematicFilterBarProps {
  /**
   * `overlay` : posée sur un média sombre (fil immersif) — fond translucide et
   * texte clair. `surface` : sur fond crème.
   */
  variant?: 'surface' | 'overlay';
}

/**
 * Barre de filtrage horizontal par thématique (RG-THE-01).
 */
export const ThematicFilterBar: React.FC<ThematicFilterBarProps> = ({ variant = 'surface' }) => {
  const { t } = useTranslation();
  const { selectedThematics, toggleThematic, resetFilters } = useFilterStore();
  const { colors } = useAccessibility();

  const allSelected = selectedThematics.length === 0;

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}
      >
        <FilterPill
          label={t('feed.filterAll')}
          emoji=""
          isSelected={allSelected}
          onPress={resetFilters}
          activeColor={variant === 'overlay' ? '#FFFFFF' : colors.primary}
          variant={variant}
        />

        {THEMATICS.map((item) => {
          const thematicColor =
            colors.thematic[item.colorToken as keyof typeof colors.thematic] || colors.primary;
          return (
            <FilterPill
              key={item.id}
              label={t(item.labelKey)}
              emoji={getThematicEmoji(item.id)}
              isSelected={selectedThematics.includes(item.id)}
              onPress={() => toggleThematic(item.id)}
              activeColor={thematicColor}
              variant={variant}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

// ─── Pilule de filtre ───────────────────────────────────────────────
interface FilterPillProps {
  label: string;
  emoji: string;
  isSelected: boolean;
  onPress: () => void;
  activeColor: string;
  variant: 'surface' | 'overlay';
}

const FilterPill: React.FC<FilterPillProps> = ({
  label,
  emoji,
  isSelected,
  onPress,
  activeColor,
  variant,
}) => {
  const { colors, getFontSize } = useAccessibility();
  const progress = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(isSelected ? 1 : 0, { duration: motion.durations.base });
  }, [isSelected, progress]);

  const isOverlay = variant === 'overlay';
  const restingBackground = isOverlay ? withAlpha('#000000', 0.38) : colors.surface;
  const restingText = isOverlay ? withAlpha('#FFFFFF', 0.85) : colors.textSecondary;
  // Sur média sombre, la pilule « Tous » devient blanche : son texte doit
  // alors repasser en sombre pour rester lisible.
  const activeText = isOverlay && activeColor === '#FFFFFF' ? colors.textPrimary : '#FFFFFF';

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [restingBackground, activeColor]),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [restingText, activeText]),
  }));

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={motion.scale.chip}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`Filtrer par ${label}`}
    >
      <Animated.View style={[styles.pill, pillStyle]}>
        {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
        <Animated.Text
          numberOfLines={1}
          style={[
            {
              fontSize: getFontSize(typography.sizes.caption),
              fontFamily: isSelected
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
  track: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  emoji: {
    fontSize: 13,
  },
});

export default ThematicFilterBar;
