import React, { useState } from 'react';
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
import { verifyFact, type FactCheck } from '../services/api/assistant';
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

/** Une vérification menée pendant la session, la plus récente en tête. */
interface Verification {
  id: string;
  affirmation: string;
  resultat: FactCheck;
}

export default function AssistantScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const { isAuthenticated } = useAuthStore();

  const [affirmation, setAffirmation] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [erreur, setErreur] = useState('');
  const [verifications, setVerifications] = useState<Verification[]>([]);

  const verifier = async () => {
    const texte = affirmation.trim();
    if (!texte || isVerifying) return;
    setErreur('');
    setIsVerifying(true);
    try {
      const resultat = await verifyFact(texte);
      setVerifications((courantes) => [
        { id: `${Date.now()}`, affirmation: texte, resultat },
        ...courantes,
      ]);
      setAffirmation('');
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
            <Text
              style={{
                alignSelf: 'flex-end',
                color: colors.textTertiary,
                fontSize: getFontSize(typography.sizes.micro),
                fontFamily: typography.families.body,
                marginTop: spacing.xs,
                marginBottom: spacing.md,
              }}
            >
              {affirmation.length}/{AFFIRMATION_MAX}
            </Text>

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
                label={t('ai.verify')}
                onPress={() => void verifier()}
                disabled={!affirmation.trim()}
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
                  « {verification.affirmation} »
                </Text>

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
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
});
