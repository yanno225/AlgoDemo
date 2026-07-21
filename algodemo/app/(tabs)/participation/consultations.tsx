import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { useAuthStore } from '../../../stores/authStore';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PressableScale } from '../../../components/ui/PressableScale';
import { TAB_BAR_CLEARANCE } from '../../../components/ui/Screen';
import { enterListItem, enterSheet } from '../../../components/ui/motion';
import { StatusPill } from '../../../components/feature/participation/StatusPill';
import { ProgressBar } from '../../../components/feature/participation/ProgressBar';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  scrimGradient,
  scrimLocations,
} from '../../../constants/theme';

const BLURHASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';
const OPINION_MAX = 800;

interface Consultation {
  id: string;
  title: string;
  description: string;
  progress: number;
  progressLabelKey: 'participation' | 'quorum' | 'contributions';
  daysLeft: number;
}

// TODO(backend) : remplacer par GET /consultations
const MOCK_CONSULTATIONS: Consultation[] = [
  {
    id: 'con_1',
    title: 'Transition écologique : plan de rénovation énergétique 2026',
    description:
      'Définition des nouvelles aides pour la rénovation thermique des bâtiments publics et privés.',
    progress: 74,
    progressLabelKey: 'participation',
    daysLeft: 14,
  },
  {
    id: 'con_2',
    title: 'Numérique : protection de la vie privée des mineurs en ligne',
    description:
      'Projet de loi visant à renforcer le contrôle parental et la régulation des algorithmes de recommandation.',
    progress: 42,
    progressLabelKey: 'quorum',
    daysLeft: 21,
  },
  {
    id: 'con_3',
    title: 'Transports : développement du rail régional transfrontalier',
    description:
      'Consultation sur l’ouverture de nouvelles lignes ferroviaires à bas carbone entre les métropoles.',
    progress: 18,
    progressLabelKey: 'contributions',
    daysLeft: 35,
  },
];

export default function ConsultationsScreen() {
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const { isAuthenticated } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [selected, setSelected] = useState<Consultation | null>(null);
  const [opinion, setOpinion] = useState('');

  const submitOpinion = () => {
    // TODO(backend) : POST /consultations/:id/contributions (modération différée).
    setSelected(null);
    setOpinion('');
  };

  return (
    <>
      <FlatList
        data={MOCK_CONSULTATIONS}
        keyExtractor={(item) => item.id}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_CLEARANCE + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Animated.View entering={enterListItem(0)} style={styles.banner}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=900',
              }}
              placeholder={{ blurhash: BLURHASH }}
              contentFit="cover"
              transition={220}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={scrimGradient}
              locations={scrimLocations}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.bannerContent}>
              <Text
                style={[
                  styles.bannerTitle,
                  {
                    fontSize: getFontSize(typography.sizes.h3),
                    fontFamily: typography.families.heading,
                  },
                ]}
              >
                {t('participation.consultations.workshopsTitle')}
              </Text>
              <Text
                style={[
                  styles.bannerSubtitle,
                  {
                    fontSize: getFontSize(typography.sizes.bodySmall),
                    fontFamily: typography.families.body,
                  },
                ]}
              >
                {t('participation.consultations.workshopsSubtitle')}
              </Text>
            </View>
          </Animated.View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={enterListItem(index + 1)}>
            <View style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}>
              <View style={styles.cardHeader}>
                <StatusPill label={t('participation.status.inProgress')} tone="progress" pulse />
                <Text
                  style={{
                    color: colors.textTertiary,
                    fontSize: getFontSize(typography.sizes.micro),
                    fontFamily: typography.families.bodyMedium,
                  }}
                >
                  {t('participation.status.daysLeft', { count: item.daysLeft })}
                </Text>
              </View>

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

              <View style={styles.progress}>
                <ProgressBar
                  value={item.progress}
                  label={t(`participation.consultations.${item.progressLabelKey}`)}
                  delay={index * 120}
                />
              </View>

              {/* Un seul bouton plein par carte : l'action secondaire passe en
                  contour pour marquer la hiérarchie. */}
              <View style={styles.actions}>
                <Button
                  label={t('participation.consultations.consultProject')}
                  onPress={() => {
                    /* TODO(backend) : ouverture du résumé de projet de loi */
                  }}
                  variant="outline"
                  size="sm"
                  style={styles.actionButton}
                />
                <Button
                  label={t('participation.consultations.giveOpinion')}
                  onPress={() => setSelected(item)}
                  size="sm"
                  haptic="medium"
                  style={styles.actionButton}
                />
              </View>
            </View>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={44} color={colors.textTertiary} />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: getFontSize(typography.sizes.bodySmall),
                fontFamily: typography.families.body,
              }}
            >
              {t('participation.consultations.empty')}
            </Text>
          </View>
        }
      />

      {/* ─── Feuille de contribution ────────────────────────────────── */}
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.overlay, { backgroundColor: colors.overlay }]}
        >
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
                  {t('participation.consultations.opinionTitle')}
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
                    color: colors.textSecondary,
                    fontSize: getFontSize(typography.sizes.bodySmall),
                    fontFamily: typography.families.body,
                  },
                ]}
              >
                {selected.title}
              </Text>

              <Input
                label={t('participation.consultations.opinionLabel')}
                placeholder={t('participation.consultations.opinionPlaceholder')}
                value={opinion}
                onChangeText={setOpinion}
                multiline
                numberOfLines={5}
                maxLength={OPINION_MAX}
                showCounter
              />

              <Button
                label={t('participation.consultations.submitOpinion')}
                onPress={submitOpinion}
                disabled={!opinion.trim() || !isAuthenticated}
                haptic="success"
                size="lg"
              />
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  banner: {
    height: 150,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  bannerContent: {
    padding: spacing.lg,
  },
  bannerTitle: {
    color: '#FFFFFF',
    marginBottom: 2,
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
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
  cardTitle: {
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  progress: {
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
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
    marginBottom: spacing.sm,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetQuestion: {
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
});
