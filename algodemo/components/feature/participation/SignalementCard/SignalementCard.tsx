import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../../../../hooks/useAccessibility';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  topScrimGradient,
  withAlpha,
} from '../../../../constants/theme';
import { PressableScale } from '../../../ui/PressableScale';
import { StatusPill } from '../StatusPill';

const BLURHASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

export type SignalementStatus = 'progress' | 'resolved';

export interface Signalement {
  id: string;
  title: string;
  description: string;
  category: string;
  time: string;
  status: SignalementStatus;
  imageUri?: string;
  supports: number;
  comments: number;
}

export interface SignalementCardProps {
  item: Signalement;
  onPress?: () => void;
}

/**
 * Carte d'un signalement citoyen.
 *
 * L'état est posé sur le média, en haut à gauche, sous un voile sombre : dans
 * la version précédente il partageait une ligne avec la catégorie et
 * l'horodatage, ce qui produisait trois blocs de tailles différentes serrés au
 * même endroit et sans hiérarchie lisible.
 */
export const SignalementCard: React.FC<SignalementCardProps> = ({ item, onPress }) => {
  const { colors, getFontSize } = useAccessibility();
  const { t } = useTranslation();

  const [isSupported, setIsSupported] = useState(false);
  const [supports, setSupports] = useState(item.supports);

  const supportScale = useSharedValue(1);

  const toggleSupport = () => {
    supportScale.value = withSequence(
      withSpring(1.2, motion.bounce),
      withSpring(1, motion.bounce)
    );
    setSupports((n) => n + (isSupported ? -1 : 1));
    setIsSupported((v) => !v);
  };

  const supportStyle = useAnimatedStyle(() => ({
    transform: [{ scale: supportScale.value }],
  }));

  const statusLabel =
    item.status === 'resolved'
      ? t('participation.status.resolved')
      : t('participation.status.inProgress');

  return (
    <PressableScale
      onPress={onPress ?? (() => {})}
      haptic={onPress ? 'light' : 'none'}
      scaleTo={motion.scale.card}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={`${item.title}. ${statusLabel}. ${item.time}`}
      style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}
    >
      {/* ─── Média + état ──────────────────────────────────────────── */}
      <View style={styles.mediaWrapper}>
        {item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            placeholder={{ blurhash: BLURHASH }}
            contentFit="cover"
            transition={200}
            style={styles.media}
          />
        ) : (
          <View style={[styles.media, styles.mediaFallback, { backgroundColor: colors.primaryPale }]}>
            <Ionicons name="image-outline" size={28} color={colors.primary} />
          </View>
        )}

        {/* Voile court : garde la pastille lisible sur une photo claire. */}
        <LinearGradient colors={topScrimGradient} style={styles.mediaScrim} pointerEvents="none" />

        <StatusPill
          label={statusLabel}
          tone={item.status === 'resolved' ? 'resolved' : 'progress'}
          pulse={item.status === 'progress'}
          style={styles.statusOnMedia}
        />

        <View style={[styles.timeChip, { backgroundColor: withAlpha('#000000', 0.55) }]}>
          <Ionicons name="time-outline" size={11} color="#FFFFFF" />
          <Text
            style={[
              styles.timeText,
              {
                fontSize: getFontSize(typography.sizes.micro),
                fontFamily: typography.families.bodyMedium,
              },
            ]}
          >
            {item.time}
          </Text>
        </View>
      </View>

      {/* ─── Contenu ───────────────────────────────────────────────── */}
      <View style={styles.body}>
        <Text
          style={[
            styles.category,
            {
              color: colors.textTertiary,
              fontSize: getFontSize(typography.sizes.micro),
              fontFamily: typography.families.bodyBold,
            },
          ]}
        >
          {item.category.toUpperCase()}
        </Text>

        <Text
          numberOfLines={2}
          style={[
            styles.title,
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
          numberOfLines={2}
          style={[
            styles.description,
            {
              color: colors.textSecondary,
              fontSize: getFontSize(typography.sizes.bodySmall),
              fontFamily: typography.families.body,
            },
          ]}
        >
          {item.description}
        </Text>

        {/* ─── Actions ─────────────────────────────────────────────── */}
        <View style={[styles.actions, { borderTopColor: colors.borderLight }]}>
          <Animated.View style={supportStyle}>
            <CardAction
              icon={isSupported ? 'thumbs-up' : 'thumbs-up-outline'}
              label={String(supports)}
              tint={isSupported ? colors.primary : colors.textSecondary}
              onPress={toggleSupport}
              accessibilityLabel={t('participation.signalements.actions.support')}
              haptic="medium"
            />
          </Animated.View>

          <CardAction
            icon="chatbubble-outline"
            label={String(item.comments)}
            tint={colors.textSecondary}
            onPress={() => {
              /* TODO(backend) : fil de commentaires modérés du signalement */
            }}
            accessibilityLabel={t('participation.signalements.actions.comment')}
          />

          <View style={styles.spacer} />

          <CardAction
            icon="share-outline"
            tint={colors.textSecondary}
            onPress={() => {
              /* TODO(backend) : partage d'un lien profond vers le signalement */
            }}
            accessibilityLabel={t('participation.signalements.actions.share')}
          />
        </View>
      </View>
    </PressableScale>
  );
};

// ─── Action de bas de carte ─────────────────────────────────────────
const CardAction: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  tint: string;
  onPress: () => void;
  accessibilityLabel: string;
  haptic?: 'light' | 'medium';
}> = ({ icon, label, tint, onPress, accessibilityLabel, haptic = 'light' }) => {
  const { getFontSize } = useAccessibility();

  return (
    <PressableScale
      onPress={onPress}
      haptic={haptic}
      scaleTo={motion.scale.chip}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.action}
    >
      <Ionicons name={icon} size={17} color={tint} />
      {label !== undefined && (
        <Text
          style={{
            color: tint,
            fontSize: getFontSize(typography.sizes.caption),
            fontFamily: typography.families.bodySemiBold,
          }}
        >
          {label}
        </Text>
      )}
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  mediaWrapper: {
    position: 'relative',
  },
  media: {
    width: '100%',
    height: 160,
  },
  mediaFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 72,
  },
  statusOnMedia: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  timeChip: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  timeText: {
    color: '#FFFFFF',
  },
  body: {
    padding: spacing.lg,
  },
  category: {
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  title: {
    lineHeight: 21,
    marginBottom: spacing.xs,
  },
  description: {
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.xs,
  },
  spacer: {
    flex: 1,
  },
});

export default SignalementCard;
