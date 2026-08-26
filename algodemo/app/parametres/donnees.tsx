import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
import { enterListItem, enterFade } from '../../components/ui/motion';
import { getMyDataExport } from '../../services/api/auth';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  withAlpha,
} from '../../constants/theme';

const CONTENU_KEYS = ['contient1', 'contient2', 'contient3', 'contient4'] as const;

/**
 * Portabilité des données (RGPD art. 20) : le serveur assemble un export
 * JSON complet, l'app l'écrit dans son cache et ouvre la feuille de partage
 * du téléphone — le citoyen l'envoie où il veut (email, drive, fichiers).
 */
export default function DonneesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const insets = useSafeAreaInsets();

  const [isExporting, setIsExporting] = useState(false);
  const [erreur, setErreur] = useState('');

  const exporter = async () => {
    if (isExporting) return;
    setErreur('');
    setIsExporting(true);
    try {
      const donnees = await getMyDataExport();
      const jour = new Date().toISOString().slice(0, 10);
      const chemin = `${FileSystem.cacheDirectory}algodemo-mes-donnees-${jour}.json`;
      await FileSystem.writeAsStringAsync(chemin, JSON.stringify(donnees, null, 2));
      // Expo Go sait partager un fichier local ; sans partage disponible,
      // on prévient au lieu d'échouer en silence.
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(chemin, {
          mimeType: 'application/json',
          dialogTitle: t('parametres.donnees.export'),
        });
      } else {
        setErreur(t('parametres.donnees.exportError'));
      }
    } catch {
      setErreur(t('parametres.donnees.exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Screen>
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
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: getFontSize(typography.sizes.h4),
            fontFamily: typography.families.headingSemiBold,
          }}
        >
          {t('parametres.donnees.title')}
        </Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
      >
        <Animated.View
          entering={enterListItem(0)}
          style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: getFontSize(typography.sizes.caption),
              fontFamily: typography.families.body,
              lineHeight: 19,
            }}
          >
            {t('parametres.donnees.intro')}
          </Text>

          <Text
            style={{
              color: colors.textPrimary,
              fontSize: getFontSize(typography.sizes.caption),
              fontFamily: typography.families.bodyBold,
              marginTop: spacing.lg,
              marginBottom: spacing.xs,
            }}
          >
            {t('parametres.donnees.contientTitle')}
          </Text>
          {CONTENU_KEYS.map((cle) => (
            <View key={cle} style={styles.puceRow}>
              <Ionicons name="checkmark-circle" size={15} color={colors.success} />
              <Text
                style={{
                  flex: 1,
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.caption),
                  fontFamily: typography.families.body,
                  lineHeight: 18,
                }}
              >
                {t(`parametres.donnees.${cle}`)}
              </Text>
            </View>
          ))}

          <Button
            label={
              isExporting
                ? t('parametres.donnees.exporting')
                : t('parametres.donnees.export')
            }
            onPress={() => void exporter()}
            disabled={isExporting}
            variant="primary"
            haptic="medium"
            style={{ marginTop: spacing.lg }}
          />

          {erreur ? (
            <Animated.View
              entering={enterFade()}
              style={[styles.erreur, { backgroundColor: withAlpha(colors.error, 0.1) }]}
            >
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text
                style={{
                  flex: 1,
                  color: colors.error,
                  fontSize: getFontSize(typography.sizes.caption),
                  fontFamily: typography.families.bodyMedium,
                }}
              >
                {erreur}
              </Text>
            </Animated.View>
          ) : null}
        </Animated.View>

        {/* Le pendant « effacement » : renvoie vers l'anonymisation existante. */}
        <Animated.View
          entering={enterListItem(1)}
          style={[styles.card, { backgroundColor: colors.surface }, shadows.sm]}
        >
          <View style={styles.deleteRow}>
            <View style={[styles.deleteIcon, { backgroundColor: withAlpha(colors.error, 0.1) }]}>
              <Ionicons name="eye-off-outline" size={19} color={colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.bodySemiBold,
                }}
              >
                {t('parametres.donnees.deleteTitle')}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.caption),
                  fontFamily: typography.families.body,
                  marginTop: 2,
                }}
              >
                {t('parametres.donnees.deleteDesc')}
              </Text>
            </View>
          </View>
          <Button
            label={t('parametres.donnees.deleteAction')}
            onPress={() => router.push('/parametres/anonymisation')}
            variant="outline"
            size="sm"
            haptic="light"
            style={{ marginTop: spacing.md }}
          />
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
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
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  puceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  erreur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  deleteIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
