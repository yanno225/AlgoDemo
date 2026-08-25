import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../../../../hooks/useAccessibility';
import { useAuthStore } from '../../../../stores/authStore';
import { PressableScale } from '../../../ui/PressableScale';
import { enterSheet, enterListItem } from '../../../ui/motion';
import {
  listComments,
  postComment,
  toggleCommentLike,
  listMyCommentLikes,
  type Commentaire,
} from '../../../../services/api/feed';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  withAlpha,
} from '../../../../constants/theme';

interface CommentsSheetProps {
  /** Identifiant du contenu commenté, ou `null` pour masquer la feuille. */
  contenuId: string | null;
  onClose: () => void;
  /** Notifie la carte qu'un commentaire a été publié (compteur du rail). */
  onCommentPosted?: () => void;
}

/** « il y a 2 h » sans dépendance : trois paliers suffisent ici. */
function formatRelative(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes} min`;
  const heures = Math.round(minutes / 60);
  if (heures < 24) return `${heures} h`;
  const jours = Math.round(heures / 24);
  return `${jours} j`;
}

/** Réactions d'un geste, comme sur les réseaux que le public connaît. */
const EMOJIS_RAPIDES = ['❤️', '🙌', '🔥', '👏', '😂', '😮', '💯'];

/**
 * Un message composé uniquement d'émojis (3 max) s'affiche en GRAND — c'est
 * le « sticker » des grandes apps sociales, sans fichier à héberger.
 */
function estSticker(texte: string): boolean {
  const compact = texte.replace(/\s+/g, '');
  if (!compact || compact.length > 12) return false;
  if (/[\p{L}\p{N}]/u.test(compact)) return false;
  const graphemes = [...new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(compact)];
  return graphemes.length <= 3;
}

/**
 * Couleur d'avatar stable par auteur : le même nom garde la même couleur
 * d'une ouverture à l'autre — repère visuel dans la conversation.
 */
const TEINTES_AVATARS = ['#E73C27', '#C9952B', '#5C8A2A', '#B17609', '#2A7FBA'];
function teinteAuteur(auteur: string): string {
  let hash = 0;
  for (let i = 0; i < auteur.length; i += 1) {
    hash = (hash * 31 + auteur.charCodeAt(i)) | 0;
  }
  return TEINTES_AVATARS[Math.abs(hash) % TEINTES_AVATARS.length];
}

/** Fil regroupé : commentaires racines dans l'ordre, réponses sous leur parent. */
interface LigneFil {
  commentaire: Commentaire;
  estReponse: boolean;
}

/**
 * Fil de commentaires d'un contenu du feed — le langage des grandes apps
 * sociales : panneau aux trois quarts, cœurs sur les commentaires, réponses
 * emboîtées, stickers émojis, barre d'émojis rapide, saisie en pilule.
 */
export const CommentsSheet: React.FC<CommentsSheetProps> = ({
  contenuId,
  onClose,
  onCommentPosted,
}) => {
  const { colors, getFontSize } = useAccessibility();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();

  const [comments, setComments] = useState<Commentaire[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<Commentaire | null>(null);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<LigneFil>>(null);
  const inputRef = useRef<TextInput>(null);

  const selfInitials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : '·';

  useEffect(() => {
    if (!contenuId) return;
    let cancelled = false;
    setIsLoading(true);
    setComments([]);
    setLikedIds(new Set());
    setReplyTo(null);
    listComments(contenuId)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .catch(() => {
        // Réseau en panne : la feuille reste utilisable.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    if (useAuthStore.getState().isAuthenticated) {
      listMyCommentLikes(contenuId)
        .then((ids) => {
          if (!cancelled) setLikedIds(ids);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [contenuId]);

  // Racines dans l'ordre chronologique, chaque réponse sous son parent.
  const lignes = useMemo<LigneFil[]>(() => {
    const reponses = new Map<string, Commentaire[]>();
    for (const comment of comments) {
      if (comment.parentId) {
        const groupe = reponses.get(comment.parentId) ?? [];
        groupe.push(comment);
        reponses.set(comment.parentId, groupe);
      }
    }
    const resultat: LigneFil[] = [];
    for (const comment of comments) {
      if (comment.parentId) continue;
      resultat.push({ commentaire: comment, estReponse: false });
      for (const reponse of reponses.get(comment.id) ?? []) {
        resultat.push({ commentaire: reponse, estReponse: true });
      }
    }
    return resultat;
  }, [comments]);

  const handleSend = useCallback(async () => {
    const texte = draft.trim();
    if (!contenuId || !texte || isSending) return;
    setIsSending(true);
    try {
      const nouveau = await postComment(contenuId, texte, replyTo?.id);
      setComments((current) => [...current, nouveau]);
      setDraft('');
      setReplyTo(null);
      onCommentPosted?.();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSending(false);
    }
  }, [contenuId, draft, isSending, replyTo, onCommentPosted]);

  /** Cœur optimiste ; le serveur fait foi dans la foulée. */
  const handleLike = useCallback(
    (commentaire: Commentaire) => {
      if (!isAuthenticated) return;
      const liked = likedIds.has(commentaire.id);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLikedIds((current) => {
        const suivant = new Set(current);
        if (liked) suivant.delete(commentaire.id);
        else suivant.add(commentaire.id);
        return suivant;
      });
      const decale = liked ? -1 : 1;
      setComments((current) =>
        current.map((c) =>
          c.id === commentaire.id
            ? { ...c, nbAimes: Math.max(0, c.nbAimes + decale) }
            : c
        )
      );
      toggleCommentLike(commentaire.id)
        .then(({ aime, total }) => {
          setLikedIds((current) => {
            const suivant = new Set(current);
            if (aime) suivant.add(commentaire.id);
            else suivant.delete(commentaire.id);
            return suivant;
          });
          setComments((current) =>
            current.map((c) =>
              c.id === commentaire.id ? { ...c, nbAimes: total } : c
            )
          );
        })
        .catch(() => {
          // Retour arrière : l'état d'avant, jamais un cœur menteur.
          setLikedIds((current) => {
            const suivant = new Set(current);
            if (liked) suivant.add(commentaire.id);
            else suivant.delete(commentaire.id);
            return suivant;
          });
          setComments((current) =>
            current.map((c) =>
              c.id === commentaire.id
                ? { ...c, nbAimes: Math.max(0, c.nbAimes - decale) }
                : c
            )
          );
        });
    },
    [isAuthenticated, likedIds]
  );

  const commencerReponse = useCallback((commentaire: Commentaire) => {
    void Haptics.selectionAsync();
    setReplyTo(commentaire);
    inputRef.current?.focus();
  }, []);

  const ajouterEmoji = useCallback((emoji: string) => {
    void Haptics.selectionAsync();
    setDraft((current) => `${current}${emoji}`);
    inputRef.current?.focus();
  }, []);

  if (!contenuId) return null;

  const canSend = draft.trim().length > 0 && !isSending;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t('common.back')}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.avoider}
          pointerEvents="box-none"
        >
          <Animated.View
            entering={enterSheet()}
            style={[styles.sheet, { backgroundColor: colors.surface }, shadows.lg]}
          >
            <View style={[styles.grabber, { backgroundColor: colors.border }]} />

            {/* ─── En-tête centré, fermeture à droite ─────────────── */}
            <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.headerTitles}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: getFontSize(typography.sizes.body),
                    fontFamily: typography.families.headingSemiBold,
                  }}
                >
                  {t('feed.comments.title')}
                </Text>
                {comments.length > 0 && (
                  <Text
                    style={{
                      color: colors.textTertiary,
                      fontSize: getFontSize(typography.sizes.micro),
                      fontFamily: typography.families.bodyMedium,
                      marginTop: 1,
                    }}
                  >
                    {comments.length}
                  </Text>
                )}
              </View>
              <PressableScale
                onPress={onClose}
                scaleTo={motion.scale.chip}
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
                style={[styles.close, { backgroundColor: colors.surfaceElevated }]}
              >
                <Ionicons name="close" size={17} color={colors.textSecondary} />
              </PressableScale>
            </View>

            {isLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : lignes.length === 0 ? (
              <View style={styles.centered}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={38}
                  color={colors.textTertiary}
                />
                <Text
                  style={[
                    styles.emptyText,
                    {
                      color: colors.textSecondary,
                      fontSize: getFontSize(typography.sizes.bodySmall),
                      fontFamily: typography.families.bodySemiBold,
                    },
                  ]}
                >
                  {t('feed.comments.empty')}
                </Text>
              </View>
            ) : (
              <FlatList
                ref={listRef}
                data={lignes}
                keyExtractor={(ligne) => ligne.commentaire.id}
                showsVerticalScrollIndicator={false}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                renderItem={({ item: ligne, index }) => {
                  const { commentaire, estReponse } = ligne;
                  const teinte = teinteAuteur(commentaire.auteur);
                  const liked = likedIds.has(commentaire.id);
                  const sticker = estSticker(commentaire.texte);
                  return (
                    <Animated.View
                      entering={enterListItem(Math.min(index, 8))}
                      style={[styles.comment, estReponse && styles.reponse]}
                    >
                      <View
                        style={[
                          styles.commentAvatar,
                          estReponse && styles.reponseAvatar,
                          { backgroundColor: withAlpha(teinte, 0.16) },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: estReponse ? 12 : 15,
                            color: teinte,
                            fontFamily: typography.families.bodyBold,
                          }}
                        >
                          {commentaire.auteur.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.commentBody}>
                        <View style={styles.commentMeta}>
                          <Text
                            style={{
                              color: colors.textPrimary,
                              fontSize: getFontSize(typography.sizes.caption),
                              fontFamily: typography.families.bodyBold,
                            }}
                          >
                            {commentaire.auteur}
                          </Text>
                          <Text
                            style={{
                              color: colors.textTertiary,
                              fontSize: getFontSize(typography.sizes.micro),
                              fontFamily: typography.families.body,
                            }}
                          >
                            {formatRelative(commentaire.creeLe)}
                          </Text>
                        </View>

                        <Text
                          style={
                            sticker
                              ? styles.stickerText
                              : [
                                  styles.commentText,
                                  {
                                    color: colors.textPrimary,
                                    fontSize: getFontSize(typography.sizes.bodySmall),
                                    fontFamily: typography.families.body,
                                  },
                                ]
                          }
                        >
                          {commentaire.texte}
                        </Text>

                        <PressableScale
                          onPress={() => commencerReponse(commentaire)}
                          scaleTo={motion.scale.chip}
                          haptic="none"
                          accessibilityRole="button"
                          accessibilityLabel={`${t('feed.comments.reply')} — ${commentaire.auteur}`}
                          style={styles.replyButton}
                        >
                          <Text
                            style={{
                              color: colors.textTertiary,
                              fontSize: getFontSize(typography.sizes.micro),
                              fontFamily: typography.families.bodyBold,
                            }}
                          >
                            {t('feed.comments.reply')}
                          </Text>
                        </PressableScale>
                      </View>

                      {/* Cœur à droite, compteur dessous — la grammaire TikTok. */}
                      <PressableScale
                        onPress={() => handleLike(commentaire)}
                        scaleTo={0.8}
                        haptic="none"
                        accessibilityRole="button"
                        accessibilityState={{ selected: liked }}
                        accessibilityLabel={t('feed.comments.like')}
                        style={styles.likeColumn}
                      >
                        <Ionicons
                          name={liked ? 'heart' : 'heart-outline'}
                          size={17}
                          color={liked ? colors.error : colors.textTertiary}
                        />
                        {commentaire.nbAimes > 0 && (
                          <Text
                            style={{
                              color: liked ? colors.error : colors.textTertiary,
                              fontSize: getFontSize(typography.sizes.micro),
                              fontFamily: typography.families.bodySemiBold,
                            }}
                          >
                            {commentaire.nbAimes}
                          </Text>
                        )}
                      </PressableScale>
                    </Animated.View>
                  );
                }}
              />
            )}

            {/* ─── Émojis d'un geste ────────────────────────────────── */}
            <View style={[styles.emojiRow, { borderTopColor: colors.borderLight }]}>
              {EMOJIS_RAPIDES.map((emoji) => (
                <PressableScale
                  key={emoji}
                  onPress={() => ajouterEmoji(emoji)}
                  scaleTo={0.8}
                  haptic="none"
                  accessibilityRole="button"
                  accessibilityLabel={emoji}
                  style={styles.emojiButton}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </PressableScale>
              ))}
            </View>

            {/* ─── Réponse en cours ─────────────────────────────────── */}
            {replyTo && (
              <Animated.View
                entering={FadeIn}
                style={[styles.replyChip, { backgroundColor: colors.surfaceElevated }]}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    color: colors.textSecondary,
                    fontSize: getFontSize(typography.sizes.micro),
                    fontFamily: typography.families.bodyMedium,
                  }}
                >
                  {t('feed.comments.replyingTo', { name: replyTo.auteur })}
                </Text>
                <PressableScale
                  onPress={() => setReplyTo(null)}
                  scaleTo={motion.scale.chip}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.cancel')}
                  style={styles.replyCancel}
                >
                  <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                </PressableScale>
              </Animated.View>
            )}

            {/* ─── Saisie en pilule, avatar à gauche ───────────────── */}
            <View style={styles.composer}>
              {user?.avatarUri ? (
                <Image
                  source={{ uri: user.avatarUri }}
                  contentFit="cover"
                  style={styles.selfAvatar}
                  accessibilityLabel={t('liveRoom.you')}
                />
              ) : (
                <View
                  style={[styles.selfAvatar, { backgroundColor: withAlpha(colors.primary, 0.14) }]}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 13,
                      fontFamily: typography.families.bodyBold,
                    }}
                  >
                    {selfInitials}
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.inputPill,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <TextInput
                  ref={inputRef}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={
                    replyTo
                      ? t('feed.comments.replyPlaceholder', { name: replyTo.auteur })
                      : t('feed.comments.placeholder')
                  }
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  maxLength={500}
                  accessibilityLabel={t('feed.comments.placeholder')}
                  style={[
                    styles.input,
                    {
                      color: colors.textPrimary,
                      fontSize: getFontSize(typography.sizes.bodySmall),
                      fontFamily: typography.families.body,
                    },
                  ]}
                />

                {canSend && (
                  <Animated.View entering={ZoomIn.springify().damping(14)}>
                    <PressableScale
                      onPress={handleSend}
                      haptic="medium"
                      scaleTo={motion.scale.chip}
                      accessibilityRole="button"
                      accessibilityLabel={t('feed.comments.send')}
                      style={[styles.sendButton, { backgroundColor: colors.primary }]}
                    >
                      {isSending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="arrow-up" size={17} color="#FFFFFF" />
                      )}
                    </PressableScale>
                  </Animated.View>
                )}
              </View>
            </View>

            <Animated.Text
              entering={FadeIn.delay(200)}
              style={[
                styles.charte,
                {
                  color: colors.textTertiary,
                  fontSize: getFontSize(typography.sizes.micro),
                  fontFamily: typography.families.body,
                },
              ]}
            >
              {t('feed.comments.moderated')}
            </Animated.Text>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  avoider: {
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    // Un panneau au gabarit stable, comme sur les grandes apps sociales.
    height: '76%',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },
  headerTitles: {
    alignItems: 'center',
  },
  close: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  comment: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  // Les réponses s'emboîtent sous leur parent, décalées d'un cran.
  reponse: {
    marginLeft: 36 + spacing.md,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reponseAvatar: {
    width: 28,
    height: 28,
  },
  commentBody: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: 2,
  },
  commentText: {
    lineHeight: 20,
  },
  stickerText: {
    fontSize: 38,
    lineHeight: 46,
  },
  replyButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  likeColumn: {
    alignItems: 'center',
    gap: 1,
    paddingTop: 2,
    minWidth: 26,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  emojiButton: {
    padding: spacing.xs,
  },
  emoji: {
    fontSize: 24,
  },
  replyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.sm,
  },
  replyCancel: {
    padding: 2,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  selfAvatar: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: borderRadius.xxl,
    paddingLeft: spacing.lg,
    paddingRight: 5,
    paddingVertical: 5,
    minHeight: 42,
  },
  input: {
    flex: 1,
    maxHeight: 104,
    paddingVertical: spacing.xs + 1,
    paddingRight: spacing.sm,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charte: {
    marginTop: spacing.sm,
    lineHeight: 14,
    textAlign: 'center',
  },
});

export default CommentsSheet;
