import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Screen } from '../../components/ui/Screen';
import { PressableScale } from '../../components/ui/PressableScale';
import { enterListItem } from '../../components/ui/motion';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  withAlpha,
} from '../../constants/theme';

/**
 * Politique de confidentialité de la plateforme. C'est un CONTENU (long texte
 * français), pas de la chrome d'interface : il vit ici plutôt que dans les
 * fichiers i18n, section par section. Chaque affirmation correspond à un
 * comportement réel du serveur — ne rien promettre que le code ne tient pas.
 */
const SECTIONS: {
  icon: keyof typeof Ionicons.glyphMap;
  titre: string;
  corps: string[];
}[] = [
  {
    icon: 'business-outline',
    titre: 'Qui traite vos données',
    corps: [
      "AlgoDémo est la plateforme civique du Forum Ivoirien de la Démocratie (FID). L'équipe d'organisation de la FID est responsable du traitement des données décrites ici, pour le fonctionnement de la plateforme et de l'événement public associé.",
    ],
  },
  {
    icon: 'person-outline',
    titre: 'Ce que nous collectons',
    corps: [
      'Votre compte : adresse email, prénom et nom, numéro de téléphone (facultatif), mot de passe (stocké uniquement sous forme hachée, illisible même pour nous).',
      "Vos contributions : avis, commentaires, messages de débat, signalements (avec photo et position si vous les fournissez), prises de parole en direct.",
      "Le journal technique : les actions authentifiées sont journalisées (route, date, statut) à des fins de sécurité et d'audit — jamais le contenu de vos votes.",
    ],
  },
  {
    icon: 'shield-checkmark-outline',
    titre: 'Le secret du vote, garanti par construction',
    corps: [
      "Lors d'une consultation ou d'un sondage, votre bulletin est enregistré anonymement, séparé de votre identité dès la première seconde. La plateforme retient QUE vous avez participé (l'émargement), jamais CE QUE vous avez choisi. Le serveur lui-même est incapable de relier un bulletin à un compte — nous ne pourrions pas vous le montrer, même si vous nous le demandiez.",
    ],
  },
  {
    icon: 'eye-outline',
    titre: 'Ce que les autres voient de vous',
    corps: [
      "Votre nom complet n'apparaît jamais publiquement. Dans les fils de discussion, les commentaires et les prises de parole, vous êtes affiché « Prénom N. » — et « Citoyen » si vous avez anonymisé votre compte.",
      'Si vous prenez la parole pendant un direct, votre intervention est publique et conservée dans le replay du débat : votre consentement explicite est demandé à chaque montée à la tribune.',
    ],
  },
  {
    icon: 'time-outline',
    titre: 'Durées de conservation',
    corps: [
      "Vos données sont conservées tant que votre compte est actif. Les contenus modérés (messages supprimés du fil, par exemple) sont masqués pour tous mais tracés côté serveur, à des fins d'audit d'un événement public.",
      "L'anonymisation (Paramètres → Anonymisation) détache définitivement votre identité de toutes vos contributions passées et efface vos données de compte.",
    ],
  },
  {
    icon: 'share-social-outline',
    titre: 'Partage et transferts',
    corps: [
      'Vos données ne sont ni vendues, ni louées, ni transmises à des annonceurs. Elles ne servent que la plateforme.',
      "Les directs et leurs replays sont, par nature, diffusés publiquement — seuls votre nom public et votre intervention y figurent.",
    ],
  },
  {
    icon: 'hand-left-outline',
    titre: 'Vos droits',
    corps: [
      "Accès et portabilité : « Paramètres → Mes données » vous remet à tout moment une copie complète et lisible de vos données (RGPD, art. 15 et 20).",
      'Rectification : votre profil est modifiable dans l’application.',
      "Effacement : l'anonymisation, irréversible, est disponible dans les paramètres (RGPD, art. 17).",
      "Consentements : les notifications ne sont envoyées qu'avec votre accord explicite, révocable à tout moment dans « Paramètres → Notifications ».",
      "Pour toute autre demande, adressez-vous à l'équipe d'organisation de la FID.",
    ],
  },
];

export default function ConfidentialiteScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();
  const insets = useSafeAreaInsets();

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
          {t('parametres.confidentialite.title')}
        </Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
      >
        <Text
          style={{
            color: colors.textTertiary,
            fontSize: getFontSize(typography.sizes.caption),
            fontFamily: typography.families.bodyMedium,
            marginBottom: spacing.lg,
          }}
        >
          {t('parametres.confidentialite.updated')}
        </Text>

        {SECTIONS.map((section, index) => (
          <Animated.View
            key={section.titre}
            entering={enterListItem(index)}
            style={[styles.card, { backgroundColor: colors.surface }, shadows.sm]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[styles.cardIcon, { backgroundColor: withAlpha(colors.primary, 0.1) }]}
              >
                <Ionicons name={section.icon} size={19} color={colors.primary} />
              </View>
              <Text
                style={{
                  flex: 1,
                  color: colors.textPrimary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.bodyBold,
                }}
              >
                {section.titre}
              </Text>
            </View>
            {section.corps.map((paragraphe) => (
              <Text
                key={paragraphe.slice(0, 32)}
                style={{
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.caption),
                  fontFamily: typography.families.body,
                  lineHeight: 19,
                  marginTop: spacing.sm,
                }}
              >
                {paragraphe}
              </Text>
            ))}
          </Animated.View>
        ))}
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
