import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, Share } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../../../../hooks/useAccessibility';
import { THEMATICS } from '../../../../constants/thematics';
import { VERIFICATION_LEVELS } from '../../../../constants/verification';
import {
  spacing,
  typography,
  borderRadius,
  motion,
  scrimGradient,
  scrimLocations,
  thematicGradients,
  ThematicGradientKey,
  withAlpha,
} from '../../../../constants/theme';
import { PressableScale } from '../../../ui/PressableScale';

/** Placeholder flou générique — évite le flash blanc avant l'arrivée du média. */
const BLURHASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

export interface FeedItem {
  id: string;
  title: string;
  summary: string;
  body: string;
  thematicId: string;
  source: string;
  verificationLevel: 1 | 2 | 3;
  isOfficial?: boolean;
  date: string;
  imageUrl?: string;
  likesCount?: number;
  commentsCount?: number;
}

export interface ImmersiveCardProps {
  item: FeedItem;
  index: number;
  /** Offset de défilement partagé — pilote le parallaxe du média. */
  scrollY: SharedValue<number>;
  /** Hauteur d'un élément = hauteur de l'écran. */
  itemHeight: number;
  /** Vrai lorsque la carte occupe l'écran : conditionne la lecture vocale. */
  isActive: boolean;
  /** Marge basse réservée à la tab bar flottante. */
  bottomInset: number;
  /** Marge haute réservée à l'en-tête flottant. */
  topInset: number;
}

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

/**
 * Contenu du fil en plein écran.
 *
 * Le média occupe tout l'écran et défile en parallaxe léger derrière le texte ;
 * la lisibilité vient d'un voile dégradé à quatre arrêts, pas d'un aplat noir
 * uniforme qui écraserait l'image.
 */
export const ImmersiveCard: React.FC<ImmersiveCardProps> = ({
  item,
  index,
  scrollY,
  itemHeight,
  isActive,
  bottomInset,
  topInset,
}) => {
  const { colors, getFontSize } = useAccessibility();
  const { t } = useTranslation();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(item.likesCount ?? 0);
  const [isSaved, setIsSaved] = useState(false);

  const burst = useSharedValue(0);
  const likeScale = useSharedValue(1);

  const thematic = THEMATICS.find((th) => th.id === item.thematicId);
  const gradientKey = (thematic?.colorToken ?? 'brand') as ThematicGradientKey;
  const fallbackGradient = thematicGradients[gradientKey] ?? thematicGradients.brand;

  const verification = Object.values(VERIFICATION_LEVELS).find(
    (v) => v.id === item.verificationLevel
  );
  const verificationColor = (verification
    ? colors[verification.colorToken as 'success' | 'warning' | 'info']
    : colors.primary) as string;

  // ─── Parallaxe du média ────────────────────────────────────────────
  const mediaStyle = useAnimatedStyle(() => {
    const offset = scrollY.value - index * itemHeight;
    return {
      transform: [
        {
          // Le média se déplace moins vite que la carte : la profondeur naît
          // de cet écart, sans quoi le défilement paraît plat.
          translateY: interpolate(
            offset,
            [-itemHeight, 0, itemHeight],
            [-itemHeight * 0.18, 0, itemHeight * 0.18],
            Extrapolation.CLAMP
          ),
        },
        {
          scale: interpolate(
            offset,
            [-itemHeight, 0, itemHeight],
            [1.12, 1, 1.12],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    const offset = scrollY.value - index * itemHeight;
    return {
      opacity: interpolate(
        offset,
        [-itemHeight * 0.6, 0, itemHeight * 0.6],
        [0, 1, 0],
        Extrapolation.CLAMP
      ),
    };
  });

  // ─── Synthèse vocale (RG-FEED-05) ──────────────────────────────────
  const stopSpeech = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  // Quitter la carte coupe la lecture : sans cela, deux contenus peuvent se
  // superposer à l'oreille pendant un défilement rapide.
  useEffect(() => {
    if (!isActive && isSpeaking) stopSpeech();
  }, [isActive, isSpeaking, stopSpeech]);

  useEffect(
    () => () => {
      Speech.stop();
    },
    []
  );

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeech();
      return;
    }
    setIsSpeaking(true);
    Speech.speak(`${item.title}. ${item.body}`, {
      language: 'fr',
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  };

  // ─── J'aime ────────────────────────────────────────────────────────
  const applyLike = useCallback(
    (liked: boolean) => {
      setIsLiked(liked);
      setLikes((current) => current + (liked ? 1 : -1));
    },
    []
  );

  const toggleLike = () => {
    likeScale.value = withSequence(
      withSpring(1.25, motion.bounce),
      withSpring(1, motion.bounce)
    );
    applyLike(!isLiked);
  };

  // Le double-tap aime, mais ne retire jamais : c'est un geste d'approbation,
  // pas une bascule — l'annulation passe par le bouton du rail.
  const likeByDoubleTap = useCallback(() => {
    burst.value = 0;
    burst.value = withSequence(
      withSpring(1, motion.bounce),
      withDelay(320, withTiming(0, { duration: motion.durations.base }))
    );
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isLiked) applyLike(true);
  }, [burst, isLiked, applyLike]);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      scheduleOnRN(likeByDoubleTap);
    });

  const burstStyle = useAnimatedStyle(() => ({
    opacity: burst.value,
    transform: [
      { scale: interpolate(burst.value, [0, 1], [0.4, 1.15]) },
      { rotate: `${interpolate(burst.value, [0, 1], [-18, -6])}deg` },
    ],
  }));

  const likeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const handleShare = async () => {
    try {
      await Share.share({
        title: item.title,
        message: `${item.title}\n\n${t('feed.sourceLabel')} : ${item.source} (${item.date})\n\n${item.summary}\n\n${t('feed.sharedVia')}`,
      });
    } catch {
      // Partage annulé par l'utilisateur — rien à signaler.
    }
  };

  return (
    <View style={[styles.container, { height: itemHeight }]}>
      <GestureDetector gesture={doubleTap}>
        <View style={StyleSheet.absoluteFill}>
          {/* ─── Média ─────────────────────────────────────────────── */}
          <Animated.View style={[StyleSheet.absoluteFill, mediaStyle]}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                placeholder={{ blurhash: BLURHASH }}
                contentFit="cover"
                transition={240}
                style={StyleSheet.absoluteFill}
                accessibilityLabel={item.title}
              />
            ) : (
              // Repli sans image : dégradé de la thématique, jamais un bloc gris.
              <LinearGradient
                colors={fallbackGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, styles.fallback]}
              >
                <Text style={styles.fallbackEmoji}>{getThematicEmoji(item.thematicId)}</Text>
              </LinearGradient>
            )}
          </Animated.View>

          {/* Voile bas — lisibilité du texte sans écraser l'image. */}
          <LinearGradient
            colors={scrimGradient}
            locations={scrimLocations}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Cœur du double-tap */}
          <Animated.View style={[styles.burst, burstStyle]} pointerEvents="none">
            <Ionicons name="heart" size={110} color={withAlpha('#FFFFFF', 0.92)} />
          </Animated.View>
        </View>
      </GestureDetector>

      {/* ─── Contenu textuel ─────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.content,
          contentStyle,
          { paddingBottom: bottomInset + spacing.lg, paddingTop: topInset },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.textBlock}>
          <View style={styles.sourceRow}>
            <LinearGradient
              colors={fallbackGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarEmoji}>{getThematicEmoji(item.thematicId)}</Text>
            </LinearGradient>

            <View style={styles.sourceTexts}>
              <View style={styles.sourceNameRow}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.sourceName,
                    {
                      fontSize: getFontSize(typography.sizes.bodySmall),
                      fontFamily: typography.families.bodyBold,
                    },
                  ]}
                >
                  {item.source}
                </Text>
                {item.isOfficial && (
                  // RG-FEED-04 : label « Officiel » pour les sources accréditées.
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={15}
                    color={colors.official}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.date,
                  {
                    fontSize: getFontSize(typography.sizes.caption),
                    fontFamily: typography.families.body,
                  },
                ]}
              >
                {item.date}
              </Text>
            </View>
          </View>

          <Text
            numberOfLines={3}
            style={[
              styles.title,
              {
                fontSize: getFontSize(typography.sizes.h4),
                fontFamily: typography.families.heading,
              },
            ]}
          >
            {item.title}
          </Text>

          <Text
            numberOfLines={2}
            style={[
              styles.summary,
              {
                fontSize: getFontSize(typography.sizes.bodySmall),
                fontFamily: typography.families.body,
              },
            ]}
          >
            {item.summary}
          </Text>

          <View style={styles.badgeRow}>
            <View
              style={[styles.verificationChip, { backgroundColor: withAlpha(verificationColor, 0.9) }]}
            >
              <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
              <Text
                style={[
                  styles.verificationText,
                  {
                    fontSize: getFontSize(typography.sizes.micro),
                    fontFamily: typography.families.bodyBold,
                  },
                ]}
              >
                {t('feed.verifiedLevel', { level: item.verificationLevel }).toUpperCase()}
              </Text>
            </View>

            {thematic && (
              <View style={[styles.thematicChip, { backgroundColor: withAlpha('#FFFFFF', 0.18) }]}>
                <Text
                  style={[
                    styles.thematicText,
                    {
                      fontSize: getFontSize(typography.sizes.micro),
                      fontFamily: typography.families.bodySemiBold,
                    },
                  ]}
                >
                  {t(thematic.labelKey)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ─── Rail d'actions ────────────────────────────────────────── */}
        <View style={styles.rail}>
          <Animated.View style={likeStyle}>
            <RailAction
              icon={isLiked ? 'heart' : 'heart-outline'}
              tint={isLiked ? colors.accent : '#FFFFFF'}
              label={String(likes)}
              onPress={toggleLike}
              accessibilityLabel={t('feed.actions.like')}
              haptic="medium"
            />
          </Animated.View>

          <RailAction
            icon="chatbubble-outline"
            tint="#FFFFFF"
            label={String(item.commentsCount ?? 0)}
            onPress={() => {
              /* TODO(backend) : ouverture du fil de commentaires modérés */
            }}
            accessibilityLabel={t('feed.actions.comment')}
          />

          <RailAction
            icon="paper-plane-outline"
            tint="#FFFFFF"
            onPress={handleShare}
            accessibilityLabel={t('feed.actions.share')}
          />

          <RailAction
            icon={isSaved ? 'bookmark' : 'bookmark-outline'}
            tint={isSaved ? colors.secondary : '#FFFFFF'}
            onPress={() => setIsSaved((v) => !v)}
            accessibilityLabel={t('feed.downloadOffline')}
          />

          {/* RG-FEED-05 : lecture vocale du contenu textuel. */}
          <RailAction
            icon={isSpeaking ? 'stop-circle' : 'volume-high'}
            tint={isSpeaking ? colors.secondary : '#FFFFFF'}
            onPress={handleSpeak}
            accessibilityLabel={t('feed.readAudio')}
            haptic="medium"
            emphasized
          />
        </View>
      </Animated.View>
    </View>
  );
};

// ─── Bouton du rail ─────────────────────────────────────────────────
const RailAction: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label?: string;
  onPress: () => void;
  accessibilityLabel: string;
  haptic?: 'light' | 'medium';
  emphasized?: boolean;
}> = ({ icon, tint, label, onPress, accessibilityLabel, haptic = 'light', emphasized }) => (
  <PressableScale
    onPress={onPress}
    haptic={haptic}
    scaleTo={motion.scale.chip}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    style={styles.railButton}
  >
    <View
      style={[
        styles.railIcon,
        emphasized && { backgroundColor: withAlpha('#FFFFFF', 0.16) },
      ]}
    >
      <Ionicons name={icon} size={26} color={tint} />
    </View>
    {label !== undefined && <Text style={styles.railLabel}>{label}</Text>}
  </PressableScale>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#0C100A',
    overflow: 'hidden',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackEmoji: {
    fontSize: 96,
    opacity: 0.5,
  },
  burst: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  sourceTexts: {
    flex: 1,
  },
  sourceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sourceName: {
    color: '#FFFFFF',
    flexShrink: 1,
  },
  date: {
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 1,
  },
  title: {
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: spacing.xs,
  },
  summary: {
    color: 'rgba(255, 255, 255, 0.82)',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  verificationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  verificationText: {
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  thematicChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  thematicText: {
    color: '#FFFFFF',
  },
  rail: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xs,
  },
  railButton: {
    alignItems: 'center',
    gap: 2,
  },
  railIcon: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    // Ombre portée : garde les icônes lisibles sur un média clair.
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  railLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default ImmersiveCard;
