import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useAccessibility } from '../hooks/useAccessibility';
import { useAuthStore } from '../stores/authStore';
import { PressableScale } from '../components/ui/PressableScale';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { LiveDot } from '../components/ui/LiveDot';
import { ProgressBar } from '../components/feature/participation/ProgressBar';
import { enterListItem, enterFade } from '../components/ui/motion';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  scrimGradient,
  scrimLocations,
  withAlpha,
} from '../constants/theme';

const BLURHASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

interface ChatMessage {
  id: string;
  author: string;
  initials?: string;
  isCertified?: boolean;
  isSelf?: boolean;
  time: string;
  text: string;
}

const POLL_OPTIONS = [
  { id: 'opt1', label: 'Oui, tout à fait', votes: 52 },
  { id: 'opt2', label: "Non, c'est utopique", votes: 28 },
  { id: 'opt3', label: 'Mitigé / autre solution', votes: 20 },
];

// TODO(backend) : flux temps réel (WebSocket) des messages modérés.
const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'msg_1',
    author: 'Jean Dupont',
    initials: 'JD',
    time: '14:22',
    text: "C'est une excellente initiative pour le centre-ville !",
  },
  {
    id: 'msg_2',
    author: 'Dr. Amani Koné',
    isCertified: true,
    time: '14:25',
    text: "Nous avons des données qui confirment l'impact positif sur le commerce local.",
  },
  {
    id: 'msg_3',
    author: 'Lucie Martin',
    initials: 'LM',
    time: '14:27',
    text: 'Quid des zones périphériques moins bien desservies ?',
  },
];

export default function LiveRoomScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  // L'avatar de l'utilisateur est lu depuis la session à chaque rendu plutôt
  // que figé dans le message : changer sa photo met ainsi à jour toutes ses
  // interventions déjà envoyées, et pas seulement les suivantes.
  const selfInitials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'VS';

  const [messages, setMessages] = useState(INITIAL_CHAT);
  const [draft, setDraft] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [poll, setPoll] = useState(POLL_OPTIONS);

  const totalVotes = poll.reduce((sum, option) => sum + option.votes, 0);

  const submitVote = () => {
    if (!choice || hasVoted) return;
    setPoll((current) =>
      current.map((option) =>
        option.id === choice ? { ...option, votes: option.votes + 1 } : option
      )
    );
    setHasVoted(true);
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;

    setMessages((current) => [
      ...current,
      {
        id: `msg_${Date.now()}`,
        author: t('liveRoom.you'),
        isSelf: true,
        time: "À l'instant",
        text,
      },
    ]);
    setDraft('');
    // Laisse la liste se recomposer avant de viser le bas.
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Lecteur ───────────────────────────────────────────── */}
          <View style={styles.player}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1000',
              }}
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

              <LiveDot label={t('liveRoom.live')} variant="overlay" />

              <PressableScale
                onPress={() => {
                  /* TODO(backend) : signalement d'un direct en cours */
                }}
                scaleTo={motion.scale.chip}
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
                  /* TODO(backend) : lecture du flux vidéo adaptatif (RG-FEED-07) */
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
                Le futur de la mobilité urbaine : débat public
              </Text>

              <View style={styles.playerStats}>
                <View style={styles.playerStat}>
                  <Ionicons name="eye-outline" size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.playerStatText}>
                    {t('debats.viewers', { value: '1,2 k' })}
                  </Text>
                </View>
                <View style={styles.playerStat}>
                  <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.playerStatText}>42:15</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.body}>
            {/* ─── Intervenants ────────────────────────────────────── */}
            <Animated.View
              entering={enterListItem(0)}
              style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}
            >
              <View style={styles.moderatorRow}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200',
                  }}
                  placeholder={{ blurhash: BLURHASH }}
                  contentFit="cover"
                  transition={200}
                  style={styles.moderatorAvatar}
                />
                <View style={styles.moderatorInfo}>
                  <Text
                    style={{
                      color: colors.textTertiary,
                      fontSize: getFontSize(typography.sizes.micro),
                      fontFamily: typography.families.bodyBold,
                      letterSpacing: 0.8,
                    }}
                  >
                    {t('liveRoom.moderator').toUpperCase()}
                  </Text>
                  <View style={styles.moderatorNameRow}>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: getFontSize(typography.sizes.bodySmall),
                        fontFamily: typography.families.bodyBold,
                      }}
                    >
                      Marie Vallet
                    </Text>
                    <MaterialCommunityIcons
                      name="check-decagram"
                      size={16}
                      color={colors.verified}
                    />
                  </View>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

              <Text
                style={[
                  styles.speakersLabel,
                  {
                    color: colors.textTertiary,
                    fontSize: getFontSize(typography.sizes.micro),
                    fontFamily: typography.families.bodyBold,
                  },
                ]}
              >
                {t('liveRoom.certifiedSpeakers').toUpperCase()}
              </Text>

              <View style={styles.speakersRow}>
                <View style={styles.stack}>
                  {[
                    'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=160',
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=160',
                    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=160',
                  ].map((uri, index) => (
                    <Image
                      key={uri}
                      source={{ uri }}
                      placeholder={{ blurhash: BLURHASH }}
                      contentFit="cover"
                      style={[
                        styles.stackAvatar,
                        { borderColor: colors.surface, marginLeft: index === 0 ? 0 : -12 },
                      ]}
                    />
                  ))}
                </View>

                <View style={[styles.moreBadge, { backgroundColor: colors.primaryPale }]}>
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: getFontSize(typography.sizes.caption),
                      fontFamily: typography.families.bodyBold,
                    }}
                  >
                    +2
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* ─── Sondage en direct ───────────────────────────────── */}
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
                  {t('liveRoom.livePoll').toUpperCase()}
                </Text>
              </View>

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
                Faut-il prioriser les transports en commun gratuits au détriment du
                stationnement automobile ?
              </Text>

              {!hasVoted ? (
                <View style={styles.pollOptions}>
                  {poll.map((option) => {
                    const isSelected = choice === option.id;
                    return (
                      <PressableScale
                        key={option.id}
                        onPress={() => setChoice(option.id)}
                        scaleTo={0.985}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={option.label}
                        style={[
                          styles.pollOption,
                          {
                            backgroundColor: colors.surface,
                            borderColor: isSelected ? colors.secondary : 'transparent',
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
                            { borderColor: isSelected ? colors.secondary : colors.border },
                          ]}
                        >
                          {isSelected && (
                            <View
                              style={[styles.radioDot, { backgroundColor: colors.secondary }]}
                            />
                          )}
                        </View>
                      </PressableScale>
                    );
                  })}

                  <Button
                    label={t('liveRoom.vote')}
                    onPress={submitVote}
                    disabled={!choice}
                    variant="secondary"
                    haptic="success"
                    style={styles.pollButton}
                  />
                </View>
              ) : (
                <Animated.View entering={enterFade()} style={styles.pollResults}>
                  {poll.map((option, index) => (
                    <ProgressBar
                      key={option.id}
                      value={Math.round((option.votes / totalVotes) * 100)}
                      label={option.label}
                      color={colors.secondary}
                      delay={index * 120}
                    />
                  ))}
                  <View style={styles.votedRow}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text
                      style={{
                        color: colors.success,
                        fontSize: getFontSize(typography.sizes.caption),
                        fontFamily: typography.families.bodySemiBold,
                      }}
                    >
                      {t('liveRoom.voted')}
                    </Text>
                  </View>
                </Animated.View>
              )}
            </Animated.View>

            {/* ─── Fil de discussion ───────────────────────────────── */}
            <Animated.View entering={enterListItem(2)}>
              <SectionHeader
                title={t('liveRoom.chatTitle')}
                actionLabel={t('liveRoom.messageCount', { count: messages.length + 145 })}
                onActionPress={() => {
                  /* TODO(backend) : historique complet du fil modéré */
                }}
                style={styles.chatHeader}
              />
            </Animated.View>

            <View style={styles.chat}>
              {messages.map((message, index) => (
                <Animated.View
                  key={message.id}
                  entering={enterListItem(Math.min(index, 6))}
                  style={[
                    styles.message,
                    message.isCertified && {
                      backgroundColor: withAlpha(colors.success, 0.08),
                    },
                    message.isSelf && { backgroundColor: withAlpha(colors.primary, 0.06) },
                  ]}
                >
                  {message.isSelf && user?.avatarUri ? (
                    <Image
                      source={{ uri: user.avatarUri }}
                      placeholder={{ blurhash: BLURHASH }}
                      contentFit="cover"
                      transition={200}
                      style={styles.messageAvatar}
                      accessibilityLabel={message.author}
                    />
                  ) : (
                    <View
                      style={[
                        styles.messageAvatar,
                        {
                          backgroundColor: message.isCertified
                            ? colors.success
                            : message.isSelf
                              ? colors.primary
                              : colors.surfaceElevated,
                        },
                      ]}
                    >
                      {message.isCertified ? (
                        <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
                      ) : (
                        <Text
                          style={{
                            color: message.isSelf ? '#FFFFFF' : colors.textSecondary,
                            fontSize: getFontSize(typography.sizes.micro),
                            fontFamily: typography.families.bodyBold,
                          }}
                        >
                          {message.isSelf ? selfInitials : message.initials}
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
                          color: message.isCertified ? colors.success : colors.textPrimary,
                          fontSize: getFontSize(typography.sizes.caption),
                          fontFamily: typography.families.bodyBold,
                        }}
                      >
                        {message.author}
                      </Text>
                      {message.isCertified && (
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
                        {message.time}
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
                      {message.text}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* ─── Saisie ──────────────────────────────────────────────── */}
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
              onSubmitEditing={sendMessage}
              returnKeyType="send"
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
              onPress={sendMessage}
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
      </KeyboardAvoidingView>
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
  moderatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  moderatorAvatar: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.full,
  },
  moderatorInfo: {
    flex: 1,
  },
  moderatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginVertical: spacing.lg,
  },
  speakersLabel: {
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  speakersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stack: {
    flexDirection: 'row',
  },
  stackAvatar: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    borderWidth: 2,
  },
  moreBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pollQuestion: {
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  pollOptions: {
    gap: spacing.sm,
  },
  pollOption: {
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
  pollButton: {
    marginTop: spacing.sm,
  },
  pollResults: {
    gap: spacing.lg,
  },
  votedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
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
