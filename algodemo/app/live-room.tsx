import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useAccessibility } from '../hooks/useAccessibility';
import {
  useLiveDebat,
  type LiveAffirmation,
  type LiveMessage,
} from '../hooks/useLiveDebat';
import { useAuthStore } from '../stores/authStore';
import { PressableScale } from '../components/ui/PressableScale';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { LiveDot } from '../components/ui/LiveDot';
import { SuccessCheck } from '../components/ui/SuccessCheck';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { ProgressBar } from '../components/feature/participation/ProgressBar';
import * as Haptics from 'expo-haptics';
import { enterListItem, enterFade } from '../components/ui/motion';
import { getDebate, type DebateDetail } from '../services/api/debats';
import { THEMATICS } from '../constants/thematics';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  scrimGradient,
  scrimLocations,
  thematicGradients,
  withAlpha,
} from '../constants/theme';

const BLURHASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

/** Jeton de couleur local de la thématique du débat (repli : politique). */
const thematicTokenFor = (debate: DebateDetail | null) =>
  THEMATICS.find((thematic) => thematic.id === debate?.thematicId)?.colorToken ??
  'politique';

const formatViewers = (viewers: number) =>
  viewers >= 1000
    ? `${(viewers / 1000).toFixed(1).replace('.', ',')} k`
    : String(viewers);

const formatDateLongue = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatHeure = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

/** « Awa Diallo » → « AD » — l'avatar textuel des autres participants. */
const initialesDe = (auteur: string) =>
  auteur
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0].toUpperCase())
    .join('');

export default function LiveRoomScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();

  // Fiche du débat (titre, couverture, thématique) : REST public — la salle
  // temps réel (participants, affirmations, votes) vit dans le hook socket.
  const [debate, setDebate] = useState<DebateDetail | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const {
    state,
    participants,
    affirmations,
    messages,
    myVotes,
    isStaff,
    vote,
    sendMessage,
    deleteMessage,
    report,
  } = useLiveDebat(id);

  const { user } = useAuthStore();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // L'avatar est lu depuis la session à chaque rendu plutôt que figé dans le
  // message : changer sa photo met à jour toutes ses interventions.
  const selfInitials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'VS';

  // Le fil suit la conversation : nouveau message → on vise le bas, une fois
  // la liste recomposée.
  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      60
    );
    return () => clearTimeout(timer);
  }, [messages.length]);

  const envoyer = () => {
    const texte = draft.trim();
    if (!texte) return;
    sendMessage(texte);
    setDraft('');
  };

  const confirmerSuppression = (message: LiveMessage) => {
    if (!isStaff) return;
    Alert.alert(t('liveRoom.deleteTitle'), t('liveRoom.deleteBody'), [
      { text: t('liveRoom.deleteCancel'), style: 'cancel' },
      {
        text: t('liveRoom.deleteConfirm'),
        style: 'destructive',
        onPress: () => deleteMessage(message.id),
      },
    ]);
  };

  // Motifs prédéfinis : un signalement en deux gestes pendant le direct,
  // sans clavier — le staff le reçoit instantanément (console web comprise).
  const signalerDirect = () => {
    if (state !== 'joined') {
      Alert.alert(t('liveRoom.reportLive'), t('liveRoom.reportNeedsRoom'));
      return;
    }
    const envoyer = (motif: string) => {
      report(motif);
      Alert.alert(t('liveRoom.reportLive'), t('liveRoom.reportSent'));
    };
    Alert.alert(t('liveRoom.reportLive'), t('liveRoom.reportBody'), [
      { text: t('liveRoom.reportCancel'), style: 'cancel' },
      {
        text: t('liveRoom.reportFalseInfo'),
        onPress: () => envoyer(t('liveRoom.reportFalseInfo')),
      },
      {
        text: t('liveRoom.reportInappropriate'),
        onPress: () => envoyer(t('liveRoom.reportInappropriate')),
      },
    ]);
  };

  useEffect(() => {
    if (!id) {
      setLoadFailed(true);
      return;
    }
    let cancelled = false;
    getDebate(id)
      .then((detail) => {
        if (!cancelled) setDebate(detail);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const thematicToken = thematicTokenFor(debate);
  const thematicColor = colors.thematic[thematicToken];
  const isEnded = state === 'ended' || debate?.status === 'ended';

  // ─── Débat introuvable : sortie propre, sans écran cassé ────────────
  if (loadFailed) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <Ionicons name="cloud-offline-outline" size={30} color={colors.textTertiary} />
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: getFontSize(typography.sizes.bodySmall),
            fontFamily: typography.families.body,
            textAlign: 'center',
            marginTop: spacing.md,
            marginBottom: spacing.xl,
            paddingHorizontal: spacing.xxl,
            lineHeight: 20,
          }}
        >
          {t('liveRoom.notFound')}
        </Text>
        <Button
          label={t('liveRoom.backToDebates')}
          onPress={() => router.back()}
          variant="outline"
          haptic="light"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
          keyboardShouldPersistTaps="handled"
        >
        {/* ─── Lecteur ───────────────────────────────────────────── */}
        <View style={styles.player}>
          {debate?.coverUrl ? (
            <Image
              source={{ uri: debate.coverUrl }}
              placeholder={{ blurhash: BLURHASH }}
              contentFit="cover"
              transition={240}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <LinearGradient
              colors={thematicGradients[thematicToken]}
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

          <View style={[styles.playerTop, { paddingTop: insets.top + spacing.sm }]}>
            <PressableScale
              onPress={() => router.back()}
              scaleTo={motion.scale.chip}
              accessibilityRole="button"
              accessibilityLabel={t('liveRoom.back')}
              style={[styles.playerButton, { backgroundColor: withAlpha('#000000', 0.42) }]}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </PressableScale>

            {!isEnded && <LiveDot label={t('liveRoom.live')} variant="overlay" />}

            <PressableScale
              onPress={signalerDirect}
              scaleTo={motion.scale.chip}
              haptic="light"
              accessibilityRole="button"
              accessibilityLabel={t('liveRoom.reportLive')}
              style={[styles.playerButton, { backgroundColor: withAlpha('#000000', 0.42) }]}
            >
              <Ionicons name="flag-outline" size={18} color="#FFFFFF" />
            </PressableScale>
          </View>

          <View style={styles.playCenter} pointerEvents="box-none">
            <PressableScale
              onPress={() => {
                /* TODO(livekit) : lecture du flux vidéo — nécessite un build de
                   développement, LiveKit n'entre pas dans Expo Go. */
              }}
              haptic="medium"
              scaleTo={0.9}
              accessibilityRole="button"
              accessibilityLabel={t('debats.join')}
              style={styles.playButton}
            >
              <Ionicons name="play" size={26} color="#0C100A" style={styles.playIcon} />
            </PressableScale>
          </View>

          <View style={styles.playerBottom}>
            <Text
              numberOfLines={2}
              style={[
                styles.playerTitle,
                {
                  fontSize: getFontSize(typography.sizes.h4),
                  fontFamily: typography.families.heading,
                },
              ]}
            >
              {debate?.title ?? ''}
            </Text>

            <View style={styles.playerStats}>
              {participants !== null && (
                <View style={styles.playerStat}>
                  <Ionicons name="eye-outline" size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.playerStatText}>
                    {t('debats.viewers', { value: formatViewers(participants) })}
                  </Text>
                </View>
              )}
              {debate && (
                <View style={styles.playerStat}>
                  <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.playerStatText}>
                    {formatDateLongue(debate.startsAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* ─── Direct clôturé pendant qu'on y était ────────────── */}
          {isEnded && (
            <Animated.View
              entering={enterFade()}
              style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}
            >
              <View style={styles.endedRow}>
                <MaterialCommunityIcons
                  name="flag-checkered"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={{
                    flex: 1,
                    color: colors.textPrimary,
                    fontSize: getFontSize(typography.sizes.body),
                    fontFamily: typography.families.headingSemiBold,
                  }}
                >
                  {t('liveRoom.endedTitle')}
                </Text>
              </View>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.body,
                  lineHeight: 19,
                  marginTop: spacing.sm,
                  marginBottom: spacing.lg,
                }}
              >
                {t('liveRoom.endedBody')}
              </Text>
              <Button
                label={t('liveRoom.backToDebates')}
                onPress={() => router.back()}
                variant="outline"
                haptic="light"
              />
            </Animated.View>
          )}

          {/* ─── À propos ────────────────────────────────────────── */}
          <Animated.View
            entering={enterListItem(0)}
            style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}
          >
            <Text
              style={{
                color: colors.textTertiary,
                fontSize: getFontSize(typography.sizes.micro),
                fontFamily: typography.families.bodyBold,
                letterSpacing: 0.8,
              }}
            >
              {t('liveRoom.about').toUpperCase()}
            </Text>

            {debate?.thematicLabel && (
              <View style={styles.thematicRow}>
                <View style={[styles.thematicDot, { backgroundColor: thematicColor }]} />
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: getFontSize(typography.sizes.bodySmall),
                    fontFamily: typography.families.bodyBold,
                  }}
                >
                  {debate.thematicLabel}
                </Text>
              </View>
            )}

            {debate?.description ? (
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.body,
                  lineHeight: 20,
                  marginTop: spacing.sm,
                }}
              >
                {debate.description}
              </Text>
            ) : null}

            {debate && (
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: getFontSize(typography.sizes.micro),
                  fontFamily: typography.families.body,
                  marginTop: spacing.md,
                }}
              >
                {t('liveRoom.startedOn', { date: formatDateLongue(debate.startsAt) })}
              </Text>
            )}
          </Animated.View>

          {/* ─── Affirmations au vote ────────────────────────────── */}
          <Animated.View
            entering={enterListItem(1)}
            style={[styles.card, { backgroundColor: colors.secondaryPale }, shadows.sm]}
          >
            <View style={styles.pollHeader}>
              <MaterialCommunityIcons name="poll" size={18} color={colors.secondary} />
              <Text
                style={{
                  color: colors.secondary,
                  fontSize: getFontSize(typography.sizes.caption),
                  fontFamily: typography.families.bodyBold,
                  letterSpacing: 0.6,
                }}
              >
                {t('liveRoom.affirmations').toUpperCase()}
              </Text>
            </View>

            {state === 'connecting' && (
              <View style={styles.roomStateBlock}>
                <ActivityIndicator size="small" color={colors.secondary} />
                <Text
                  style={[
                    styles.roomStateText,
                    {
                      color: colors.textSecondary,
                      fontSize: getFontSize(typography.sizes.bodySmall),
                      fontFamily: typography.families.body,
                    },
                  ]}
                >
                  {t('liveRoom.joining')}
                </Text>
              </View>
            )}

            {state === 'signed-out' && (
              <View style={styles.roomStateBlock}>
                <Text
                  style={[
                    styles.roomStateText,
                    {
                      color: colors.textSecondary,
                      fontSize: getFontSize(typography.sizes.bodySmall),
                      fontFamily: typography.families.body,
                    },
                  ]}
                >
                  {t('liveRoom.signedOut')}
                </Text>
                <Button
                  label={t('liveRoom.signIn')}
                  onPress={() => router.push('/login')}
                  variant="secondary"
                  size="sm"
                  haptic="light"
                />
              </View>
            )}

            {state === 'error' && (
              <Text
                style={[
                  styles.roomStateText,
                  {
                    color: colors.textSecondary,
                    fontSize: getFontSize(typography.sizes.bodySmall),
                    fontFamily: typography.families.body,
                  },
                ]}
              >
                {t('liveRoom.joinError')}
              </Text>
            )}

            {(state === 'joined' || state === 'ended') &&
              affirmations.length === 0 && (
                <Text
                  style={[
                    styles.roomStateText,
                    {
                      color: colors.textSecondary,
                      fontSize: getFontSize(typography.sizes.bodySmall),
                      fontFamily: typography.families.body,
                    },
                  ]}
                >
                  {t('liveRoom.affirmationsEmpty')}
                </Text>
              )}

            {affirmations.map((affirmation, index) => (
              <View key={affirmation.id}>
                {index > 0 && (
                  <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
                )}
                <AffirmationBlock
                  affirmation={affirmation}
                  myVote={myVotes[affirmation.id]}
                  onVote={vote}
                  disabled={isEnded}
                />
              </View>
            ))}
          </Animated.View>

          {/* ─── Fil de discussion ───────────────────────────────── */}
          {(state === 'joined' || state === 'ended') && (
            <>
              <Animated.View entering={enterListItem(2)}>
                <SectionHeader
                  title={t('liveRoom.chatTitle')}
                  overline={t('liveRoom.messageCount', { count: messages.length })}
                  style={styles.chatHeader}
                />
              </Animated.View>

              <View style={styles.chat}>
                {messages.length === 0 && (
                  <Text
                    style={{
                      color: colors.textTertiary,
                      fontSize: getFontSize(typography.sizes.bodySmall),
                      fontFamily: typography.families.body,
                      textAlign: 'center',
                      paddingVertical: spacing.md,
                      lineHeight: 19,
                    }}
                  >
                    {t('liveRoom.chatEmpty')}
                  </Text>
                )}

                {messages.map((message, index) => (
                  <Animated.View
                    key={message.id}
                    entering={enterListItem(Math.min(index, 6))}
                  >
                    <Pressable
                      onLongPress={() => confirmerSuppression(message)}
                      delayLongPress={450}
                      disabled={!isStaff}
                      accessibilityLabel={`${message.auteur} — ${message.texte}`}
                      style={[
                        styles.message,
                        message.certifie && {
                          backgroundColor: withAlpha(colors.success, 0.08),
                        },
                        message.estMoi && {
                          backgroundColor: withAlpha(colors.primary, 0.06),
                        },
                      ]}
                    >
                      {message.estMoi && user?.avatarUri ? (
                        <Image
                          source={{ uri: user.avatarUri }}
                          placeholder={{ blurhash: BLURHASH }}
                          contentFit="cover"
                          transition={200}
                          style={styles.messageAvatar}
                          accessibilityLabel={message.auteur}
                        />
                      ) : (
                        <View
                          style={[
                            styles.messageAvatar,
                            {
                              backgroundColor: message.certifie
                                ? colors.success
                                : message.estMoi
                                  ? colors.primary
                                  : colors.surfaceElevated,
                            },
                          ]}
                        >
                          {message.certifie ? (
                            <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
                          ) : (
                            <Text
                              style={{
                                color: message.estMoi ? '#FFFFFF' : colors.textSecondary,
                                fontSize: getFontSize(typography.sizes.micro),
                                fontFamily: typography.families.bodyBold,
                              }}
                            >
                              {message.estMoi ? selfInitials : initialesDe(message.auteur)}
                            </Text>
                          )}
                        </View>
                      )}

                      <View style={styles.messageBody}>
                        <View style={styles.messageHeader}>
                          <Text
                            numberOfLines={1}
                            style={{
                              flexShrink: 1,
                              color: message.certifie ? colors.success : colors.textPrimary,
                              fontSize: getFontSize(typography.sizes.caption),
                              fontFamily: typography.families.bodyBold,
                            }}
                          >
                            {message.estMoi ? t('liveRoom.you') : message.auteur}
                          </Text>
                          {message.certifie && (
                            <View
                              style={[
                                styles.certifiedTag,
                                { backgroundColor: withAlpha(colors.success, 0.16) },
                              ]}
                            >
                              <Text
                                style={{
                                  color: colors.success,
                                  fontSize: getFontSize(typography.sizes.micro) - 1,
                                  fontFamily: typography.families.bodyBold,
                                }}
                              >
                                {t('liveRoom.certified').toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <Text
                            style={{
                              marginLeft: 'auto',
                              color: colors.textTertiary,
                              fontSize: getFontSize(typography.sizes.micro),
                              fontFamily: typography.families.body,
                            }}
                          >
                            {formatHeure(message.creeLe)}
                          </Text>
                        </View>

                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: getFontSize(typography.sizes.bodySmall),
                            fontFamily: typography.families.body,
                            lineHeight: 19,
                          }}
                        >
                          {message.texte}
                        </Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </>
          )}
        </View>
        </ScrollView>

        {/* ─── Saisie ──────────────────────────────────────────────── */}
        {state === 'joined' && !isEnded && (
          <View
            style={[
              styles.composer,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.borderLight,
                paddingBottom: Math.max(insets.bottom, spacing.md),
              },
            ]}
          >
            <View style={[styles.composerField, { backgroundColor: colors.surface }, shadows.sm]}>
              <TextInput
                placeholder={t('liveRoom.messagePlaceholder')}
                placeholderTextColor={colors.textTertiary}
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={envoyer}
                returnKeyType="send"
                maxLength={500}
                accessibilityLabel={t('liveRoom.messagePlaceholder')}
                style={[
                  styles.composerInput,
                  {
                    color: colors.textPrimary,
                    fontSize: getFontSize(typography.sizes.bodySmall),
                    fontFamily: typography.families.body,
                  },
                ]}
              />
              <PressableScale
                onPress={envoyer}
                disabled={!draft.trim()}
                haptic="medium"
                scaleTo={motion.scale.chip}
                accessibilityRole="button"
                accessibilityLabel={t('liveRoom.send')}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: draft.trim()
                      ? colors.primary
                      : withAlpha(colors.primary, 0.16),
                  },
                ]}
              >
                <Ionicons
                  name="paper-plane"
                  size={16}
                  color={draft.trim() ? '#FFFFFF' : colors.textTertiary}
                />
              </PressableScale>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

/**
 * Une affirmation soumise à la salle : « Valider / Invalider » tant qu'elle
 * est ouverte (revoter est autorisé), résultats définitifs une fois fermée.
 */
function AffirmationBlock({
  affirmation,
  myVote,
  onVote,
  disabled,
}: {
  affirmation: LiveAffirmation;
  myVote: boolean | undefined;
  onVote: (affirmationId: string, valide: boolean) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();

  const total = affirmation.valides + affirmation.invalides;
  const pctValides = total > 0 ? Math.round((affirmation.valides / total) * 100) : 0;
  const isOpen = affirmation.statut === 'OUVERTE' && !disabled;

  // Confirmation visible SEULEMENT quand le serveur a enregistré le vote
  // (myVote vient du socket) : coche qui se dessine + vibration de succès.
  const [confirme, setConfirme] = useState(false);
  const votePrecedent = useRef(myVote);
  useEffect(() => {
    if (myVote !== undefined && votePrecedent.current !== myVote) {
      setConfirme(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const minuteur = setTimeout(() => setConfirme(false), 1100);
      votePrecedent.current = myVote;
      return () => clearTimeout(minuteur);
    }
    votePrecedent.current = myVote;
  }, [myVote]);

  return (
    <View>
      <Text
        style={[
          styles.pollQuestion,
          {
            color: colors.textPrimary,
            fontSize: getFontSize(typography.sizes.bodySmall),
            fontFamily: typography.families.bodySemiBold,
          },
        ]}
      >
        {affirmation.texte}
      </Text>

      {isOpen ? (
        <View style={styles.voteRow}>
          {(
            [
              {
                valide: true,
                label: t('liveRoom.validate'),
                icon: 'checkmark-circle' as const,
                color: colors.success,
                count: affirmation.valides,
              },
              {
                valide: false,
                label: t('liveRoom.invalidate'),
                icon: 'close-circle' as const,
                color: colors.error,
                count: affirmation.invalides,
              },
            ] as const
          ).map((option) => {
            const isSelected = myVote === option.valide;
            return (
              <PressableScale
                key={option.label}
                onPress={() => onVote(affirmation.id, option.valide)}
                scaleTo={0.97}
                haptic="light"
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${option.label} — ${affirmation.texte}`}
                style={[
                  styles.voteOption,
                  {
                    backgroundColor: isSelected
                      ? withAlpha(option.color, 0.12)
                      : colors.surface,
                    borderColor: isSelected ? option.color : 'transparent',
                  },
                ]}
              >
                <Ionicons name={option.icon} size={17} color={option.color} />
                <Text
                  style={{
                    flex: 1,
                    color: colors.textPrimary,
                    fontSize: getFontSize(typography.sizes.caption),
                    fontFamily: isSelected
                      ? typography.families.bodyBold
                      : typography.families.bodySemiBold,
                  }}
                >
                  {option.label}
                </Text>
                <AnimatedNumber
                  value={option.count}
                  duration={550}
                  style={{
                    color: colors.textTertiary,
                    fontSize: getFontSize(typography.sizes.micro),
                    fontFamily: typography.families.bodyBold,
                    textAlign: 'right',
                  }}
                />
              </PressableScale>
            );
          })}
          {confirme && (
            <View style={styles.checkOverlay} pointerEvents="none">
              <SuccessCheck size={46} color={colors.success} />
            </View>
          )}
        </View>
      ) : (
        <Animated.View entering={enterFade()} style={styles.pollResults}>
          <ProgressBar
            value={pctValides}
            label={t('liveRoom.validate')}
            color={colors.success}
            delay={0}
          />
          <ProgressBar
            value={total > 0 ? 100 - pctValides : 0}
            label={t('liveRoom.invalidate')}
            color={colors.error}
            delay={120}
          />
          <View style={styles.closedRow}>
            <Ionicons name="lock-closed" size={13} color={colors.textTertiary} />
            <Text
              style={{
                color: colors.textTertiary,
                fontSize: getFontSize(typography.sizes.micro),
                fontFamily: typography.families.bodySemiBold,
              }}
            >
              {t('liveRoom.closedVote')} · {t('liveRoom.votesCount', { count: total })}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingBottom: spacing.lg,
  },
  player: {
    height: 280,
    backgroundColor: '#0C100A',
    justifyContent: 'space-between',
  },
  playerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  playerButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 62,
    height: 62,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    marginLeft: 4,
  },
  playerBottom: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  playerTitle: {
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  playerStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  playerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  playerStatText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  endedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  thematicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  thematicDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
  },
  divider: {
    height: 1,
    marginVertical: spacing.lg,
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pollQuestion: {
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  roomStateBlock: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  roomStateText: {
    textAlign: 'center',
    lineHeight: 19,
  },
  voteRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  pollResults: {
    gap: spacing.lg,
  },
  closedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  chatHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  chat: {
    gap: spacing.sm,
  },
  message: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  messageAvatar: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBody: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 3,
  },
  certifiedTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  composer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  composerField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: borderRadius.full,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs + 2,
  },
  composerInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
