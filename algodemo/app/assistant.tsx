import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated from 'react-native-reanimated';
import { useAccessibility } from '../hooks/useAccessibility';
import { useAuthStore } from '../stores/authStore';
import { Screen } from '../components/ui/Screen';
import { Button } from '../components/ui/Button';
import { PressableScale } from '../components/ui/PressableScale';
import { VerifyingDots } from '../components/feature/auth/VerifyingDots';
import { enterListItem, enterFade } from '../components/ui/motion';
import * as DocumentPicker from 'expo-document-picker';
import {
  verifyFact,
  verifyFactFromFile,
  type FactCheck,
  type FileFactCheck,
  type FileToVerify,
} from '../services/api/assistant';
import { toApiError } from '../services/api/client';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  thematicGradients,
  withAlpha,
} from '../constants/theme';

const AFFIRMATION_MAX = 500;

/** 10 Mo — la même limite que le serveur, refusée AVANT l'envoi. */
const FICHIER_MAX_OCTETS = 10 * 1024 * 1024;

/** Une vérification menée pendant la session, la plus récente en tête. */
interface Verification {
  id: string;
  affirmation: string;
  /** Nom du fichier analysé, le cas échéant. */
  fichierNom?: string;
  resultat: FactCheck & Partial<Pick<FileFactCheck, 'affirmationAnalysee'>>;
}

export default function AssistantScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const { isAuthenticated } = useAuthStore();

  const [affirmation, setAffirmation] = useState('');
  const [fichier, setFichier] = useState<FileToVerify | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [erreur, setErreur] = useState('');
  const [verifications, setVerifications] = useState<Verification[]>([]);

  /** Choisir une image ou un PDF à faire lire par l'assistant. */
  const choisirFichier = async () => {
    setErreur('');
    const resultat = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (resultat.canceled) return;
    const choisi = resultat.assets[0];
    if ((choisi.size ?? 0) > FICHIER_MAX_OCTETS) {
      setErreur(t('ai.fileTooBig'));
      return;
    }
    setFichier({
      uri: choisi.uri,
      name: choisi.name,
      mimeType: choisi.mimeType ?? 'application/octet-stream',
    });
  };

  const verifier = async () => {
    const texte = affirmation.trim();
    if ((!texte && !fichier) || isVerifying) return;
    setErreur('');
    setIsVerifying(true);
    try {
      const resultat = fichier
        ? await verifyFactFromFile(fichier, texte || undefined)
        : await verifyFact(texte);
      setVerifications((courantes) => [
        {
          id: `${Date.now()}`,
          affirmation: texte || fichier?.name || '',
          fichierNom: fichier?.name,
          resultat,
        },
        ...courantes,
      ]);
      setAffirmation('');
      setFichier(null);
    } catch (e) {
      setErreur(toApiError(e).message || t('ai.error'));
    } finally {
      setIsVerifying(false);
    }
  };

  const verdictStyle = (verdict: FactCheck['verdict']) =>
    verdict === 'COHERENT'
      ? { couleur: colors.success, icone: 'checkmark-circle' as const }
      : verdict === 'CONTREDIT'
        ? { couleur: colors.error, icone: 'close-circle' as const }
        : { couleur: colors.textTertiary, icone: 'help-circle' as const };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {/* ─── En-tête ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <PressableScale
            onPress={() => router.back()}
            scaleTo={motion.scale.chip}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            style={[styles.iconButton, { backgroundColor: colors.surface }, shadows.sm]}
          >
            <Ionicons name="arrow-back" size={21} color={colors.textPrimary} />
          </PressableScale>

          <View style={styles.headerTitle}>
            <LinearGradient
              colors={thematicGradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerIcon}
            >
              <MaterialCommunityIcons name="creation" size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: getFontSize(typography.sizes.h4),
                fontFamily: typography.families.headingSemiBold,
              }}
            >
              {t('ai.title')}
            </Text>
          </View>

          <View style={styles.iconButtonPlaceholder} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Saisie ────────────────────────────────────────────── */}
          <Animated.View
            entering={enterListItem(0)}
            style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: getFontSize(typography.sizes.bodySmall),
                fontFamily: typography.families.body,
                lineHeight: 20,
                marginBottom: spacing.lg,
              }}
            >
              {t('ai.intro')}
            </Text>

            <TextInput
              value={affirmation}
              onChangeText={setAffirmation}
              placeholder={t('ai.placeholder')}
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={AFFIRMATION_MAX}
              editable={!isVerifying}
              accessibilityLabel={t('ai.placeholder')}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceElevated,
                  color: colors.textPrimary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.body,
                },
              ]}
            />
            <View style={styles.inputFooter}>
              {/* Joindre un tract, une capture, un article PDF… l'IA le lit. */}
              <PressableScale
                onPress={() => void choisirFichier()}
                scaleTo={motion.scale.chip}
                haptic="light"
                disabled={isVerifying}
                accessibilityRole="button"
                accessibilityLabel={t('ai.attach')}
                style={[
                  styles.attachButton,
                  { backgroundColor: withAlpha(colors.primary, 0.1) },
                ]}
              >
                <Ionicons name="attach" size={16} color={colors.primary} />
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: getFontSize(typography.sizes.micro),
                    fontFamily: typography.families.bodySemiBold,
                  }}
                >
                  {t('ai.attach')}
                </Text>
              </PressableScale>
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: getFontSize(typography.sizes.micro),
                  fontFamily: typography.families.body,
                }}
              >
                {affirmation.length}/{AFFIRMATION_MAX}
              </Text>
            </View>

            {fichier && (
              <Animated.View
                entering={enterFade()}
                style={[styles.fileChip, { backgroundColor: colors.surfaceElevated }]}
              >
                <Ionicons
                  name={fichier.mimeType === 'application/pdf' ? 'document-text' : 'image'}
                  size={15}
                  color={colors.primary}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    color: colors.textPrimary,
                    fontSize: getFontSize(typography.sizes.caption),
                    fontFamily: typography.families.bodyMedium,
                  }}
                >
                  {fichier.name}
                </Text>
                <PressableScale
                  onPress={() => setFichier(null)}
                  scaleTo={0.9}
                  haptic="light"
                  accessibilityRole="button"
                  accessibilityLabel={t('ai.removeFile')}
                  style={styles.fileRemove}
                >
                  <Ionicons name="close-circle" size={17} color={colors.textTertiary} />
                </PressableScale>
              </Animated.View>
            )}

            {!isAuthenticated ? (
              <Button
                label={t('liveRoom.signIn')}
                onPress={() => router.push('/login')}
                variant="outline"
                haptic="light"
              />
            ) : isVerifying ? (
              <View style={styles.verifying}>
                <VerifyingDots label={t('ai.verifying')} />
              </View>
            ) : (
              <Button
                label={fichier ? t('ai.verifyFile') : t('ai.verify')}
                onPress={() => void verifier()}
                disabled={!affirmation.trim() && !fichier}
                icon="sparkles"
                haptic="medium"
                size="lg"
              />
            )}

            {erreur ? (
              <Animated.View
                entering={enterFade()}
                style={[styles.errorRow, { backgroundColor: withAlpha(colors.error, 0.1) }]}
              >
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text
                  style={{
                    flex: 1,
                    color: colors.error,
                    fontSize: getFontSize(typography.sizes.caption),
                    fontFamily: typography.families.body,
                  }}
                >
                  {erreur}
                </Text>
              </Animated.View>
            ) : null}
          </Animated.View>

          {/* ─── Vérifications de la session ───────────────────────── */}
          {verifications.map((verification) => {
            const style = verdictStyle(verification.resultat.verdict);
            return (
              <Animated.View
                key={verification.id}
                entering={enterFade()}
                style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: getFontSize(typography.sizes.bodySmall),
                    fontFamily: typography.families.body,
                    fontStyle: 'italic',
                    lineHeight: 19,
                    marginBottom: spacing.md,
                  }}
                >
                  {verification.fichierNom ? '📎 ' : '« '}
                  {verification.affirmation}
                  {verification.fichierNom ? '' : ' »'}
                </Text>

                {/* Ce que l'IA a LU dans le fichier — c'est ce texte qui a
                    été soumis au verdict, le citoyen le voit tel quel. */}
                {verification.resultat.affirmationAnalysee ? (
                  <View
                    style={[
                      styles.element,
                      { backgroundColor: withAlpha(colors.secondary, 0.1) },
                    ]}
                  >
                    <Text
                      style={{
                        color: colors.textTertiary,
                        fontSize: getFontSize(typography.sizes.micro),
                        fontFamily: typography.families.bodyBold,
                        letterSpacing: 0.8,
                        marginBottom: 4,
                      }}
                    >
                      {t('ai.extractedTitle').toUpperCase()}
                    </Text>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: getFontSize(typography.sizes.caption),
                        fontFamily: typography.families.body,
                        lineHeight: 18,
                      }}
                    >
                      {verification.resultat.affirmationAnalysee}
                    </Text>
                  </View>
                ) : null}

                <View style={[styles.verdict, { backgroundColor: withAlpha(style.couleur, 0.12) }]}>
                  <Ionicons name={style.icone} size={17} color={style.couleur} />
                  <Text
                    style={{
                      flex: 1,
                      color: style.couleur,
                      fontSize: getFontSize(typography.sizes.caption),
                      fontFamily: typography.families.bodyBold,
                    }}
                  >
                    {t(`ai.verdicts.${verification.resultat.verdict}`).toUpperCase()}
                  </Text>
                </View>

                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: getFontSize(typography.sizes.bodySmall),
                    fontFamily: typography.families.body,
                    lineHeight: 20,
                    marginTop: spacing.md,
                  }}
                >
                  {verification.resultat.explication}
                </Text>

                {verification.resultat.elements.length > 0 && (
                  <View style={styles.elements}>
                    <Text
                      style={{
                        color: colors.textTertiary,
                        fontSize: getFontSize(typography.sizes.micro),
                        fontFamily: typography.families.bodyBold,
                        letterSpacing: 0.8,
                        marginBottom: spacing.sm,
                      }}
                    >
                      {t('ai.elementsTitle').toUpperCase()}
                    </Text>
                    {verification.resultat.elements.map((element, index) => (
                      <View
                        key={`${verification.id}_${index}`}
                        style={[styles.element, { backgroundColor: colors.surfaceElevated }]}
                      >
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: getFontSize(typography.sizes.caption),
                            fontFamily: typography.families.bodySemiBold,
                            lineHeight: 18,
                          }}
                        >
                          {element.indicateur} — {element.paysOuZone} :{' '}
                          {element.valeur} ({element.annee})
                        </Text>
                        <Text
                          style={{
                            color: colors.textTertiary,
                            fontSize: getFontSize(typography.sizes.micro),
                            fontFamily: typography.families.body,
                            marginTop: 2,
                          }}
                        >
                          {t('ai.sourceLabel', { source: element.source })} ·{' '}
                          {element.thematique}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {verification.resultat.sourcesWeb.length > 0 && (
                  <View style={styles.elements}>
                    <Text
                      style={{
                        color: colors.textTertiary,
                        fontSize: getFontSize(typography.sizes.micro),
                        fontFamily: typography.families.bodyBold,
                        letterSpacing: 0.8,
                        marginBottom: spacing.sm,
                      }}
                    >
                      {t('ai.webSourcesTitle').toUpperCase()}
                    </Text>
                    {verification.resultat.sourcesWeb.map((source, index) => (
                      <PressableScale
                        key={`${verification.id}_web_${index}`}
                        onPress={() => void Linking.openURL(source.url)}
                        scaleTo={0.98}
                        haptic="light"
                        accessibilityRole="link"
                        accessibilityLabel={source.titre}
                        style={[styles.element, { backgroundColor: colors.surfaceElevated }]}
                      >
                        <View style={styles.webSourceRow}>
                          <Ionicons name="globe-outline" size={14} color={colors.primary} />
                          <Text
                            numberOfLines={1}
                            style={{
                              flex: 1,
                              color: colors.primary,
                              fontSize: getFontSize(typography.sizes.caption),
                              fontFamily: typography.families.bodySemiBold,
                            }}
                          >
                            {source.titre}
                          </Text>
                          <Ionicons name="open-outline" size={13} color={colors.textTertiary} />
                        </View>
                        <Text
                          numberOfLines={1}
                          style={{
                            color: colors.textTertiary,
                            fontSize: getFontSize(typography.sizes.micro),
                            fontFamily: typography.families.body,
                            marginTop: 2,
                          }}
                        >
                          {source.url}
                        </Text>
                      </PressableScale>
                    ))}
                  </View>
                )}

                {verification.resultat.references.length > 0 && (
                  <View style={styles.elements}>
                    <Text
                      style={{
                        color: colors.textTertiary,
                        fontSize: getFontSize(typography.sizes.micro),
                        fontFamily: typography.families.bodyBold,
                        letterSpacing: 0.8,
                        marginBottom: spacing.sm,
                      }}
                    >
                      {t('ai.referencesTitle').toUpperCase()}
                    </Text>
                    {verification.resultat.references.map((reference, index) => (
                      <View
                        key={`${verification.id}_ref_${index}`}
                        style={[styles.element, { backgroundColor: colors.surfaceElevated }]}
                      >
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: getFontSize(typography.sizes.caption),
                            fontFamily: typography.families.bodySemiBold,
                            lineHeight: 18,
                          }}
                        >
                          {reference.titre}
                        </Text>
                        <Text
                          style={{
                            color: colors.textTertiary,
                            fontSize: getFontSize(typography.sizes.micro),
                            fontFamily: typography.families.body,
                            marginTop: 2,
                          }}
                        >
                          {t('ai.sourceLabel', { source: reference.source })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* L'éclairage général : utile, mais clairement HORS sources. */}
                {verification.resultat.eclairage ? (
                  <View
                    style={[
                      styles.insight,
                      { backgroundColor: withAlpha(colors.info, 0.08) },
                    ]}
                  >
                    <View style={styles.insightHeader}>
                      <Ionicons name="bulb-outline" size={14} color={colors.info} />
                      <Text
                        style={{
                          color: colors.info,
                          fontSize: getFontSize(typography.sizes.micro),
                          fontFamily: typography.families.bodyBold,
                          letterSpacing: 0.6,
                        }}
                      >
                        {t('ai.insightTitle').toUpperCase()} ·{' '}
                        {t('ai.insightBadge').toUpperCase()}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: getFontSize(typography.sizes.caption),
                        fontFamily: typography.families.body,
                        lineHeight: 18,
                      }}
                    >
                      {verification.resultat.eclairage}
                    </Text>
                  </View>
                ) : null}
              </Animated.View>
            );
          })}

          {/* ─── Engagement de transparence ────────────────────────── */}
          <Animated.View entering={enterListItem(1)} style={styles.disclaimer}>
            <Ionicons name="shield-checkmark-outline" size={15} color={colors.textTertiary} />
            <Text
              style={{
                flex: 1,
                color: colors.textTertiary,
                fontSize: getFontSize(typography.sizes.micro),
                fontFamily: typography.families.body,
                lineHeight: 16,
              }}
            >
              {t('ai.disclaimer')}
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonPlaceholder: {
    width: 40,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  input: {
    minHeight: 96,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  verifying: {
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  fileRemove: {
    padding: 2,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  elements: {
    marginTop: spacing.lg,
  },
  element: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  insight: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  webSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
});
