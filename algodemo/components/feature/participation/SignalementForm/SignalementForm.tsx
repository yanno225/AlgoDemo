import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../../../../hooks/useAccessibility';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  withAlpha,
} from '../../../../constants/theme';
import { Input } from '../../../ui/Input';
import { Button } from '../../../ui/Button';
import { PressableScale } from '../../../ui/PressableScale';
import { enterFade } from '../../../ui/motion';

const CATEGORY_KEYS = [
  'road',
  'lighting',
  'waste',
  'water',
  'safety',
  'misinformation',
  'other',
] as const;

export type SignalementCategoryKey = (typeof CATEGORY_KEYS)[number];

const CATEGORY_ICONS: Record<SignalementCategoryKey, keyof typeof Ionicons.glyphMap> = {
  road: 'construct-outline',
  lighting: 'bulb-outline',
  waste: 'trash-outline',
  water: 'water-outline',
  safety: 'shield-outline',
  misinformation: 'alert-circle-outline',
  other: 'ellipsis-horizontal',
};

const DESCRIPTION_MAX = 400;

export interface SignalementDraft {
  category: string;
  description: string;
  location: string;
  photoUri: string | null;
}

export interface SignalementFormProps {
  onSubmit: (draft: SignalementDraft) => void;
}

/**
 * Formulaire de dépôt d'un signalement.
 *
 * La catégorie se choisit parmi une liste fermée plutôt qu'en texte libre :
 * une saisie libre rendait le tri impossible côté commune et produisait autant
 * d'intitulés que de signalements.
 */
export const SignalementForm: React.FC<SignalementFormProps> = ({ onSubmit }) => {
  const { colors, getFontSize } = useAccessibility();
  const { t } = useTranslation();

  const [category, setCategory] = useState<SignalementCategoryKey | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState('');

  const isComplete = !!category && description.trim().length > 0 && location.trim().length > 0;

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSubmit = () => {
    if (!isComplete) {
      setError(t('participation.signalements.missingFields'));
      return;
    }
    setError('');
    onSubmit({
      category: t(`participation.signalements.categories.${category}`),
      description: description.trim(),
      location: location.trim(),
      photoUri,
    });

    setCategory(null);
    setDescription('');
    setLocation('');
    setPhotoUri(null);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}>
      <Text
        style={[
          styles.title,
          {
            color: colors.textPrimary,
            fontSize: getFontSize(typography.sizes.h4),
            fontFamily: typography.families.headingSemiBold,
          },
        ]}
      >
        {t('participation.signalements.formTitle')}
      </Text>
      <Text
        style={[
          styles.subtitle,
          {
            color: colors.textSecondary,
            fontSize: getFontSize(typography.sizes.caption),
            fontFamily: typography.families.body,
          },
        ]}
      >
        {t('participation.signalements.formSubtitle')}
      </Text>

      {/* ─── Catégorie ───────────────────────────────────────────────── */}
      <FieldLabel text={t('participation.signalements.category')} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {CATEGORY_KEYS.map((key) => (
          <CategoryChip
            key={key}
            label={t(`participation.signalements.categories.${key}`)}
            icon={CATEGORY_ICONS[key]}
            isSelected={category === key}
            onPress={() => {
              setCategory(key);
              if (error) setError('');
            }}
          />
        ))}
      </ScrollView>

      {/* ─── Description ─────────────────────────────────────────────── */}
      <View style={styles.field}>
        <Input
          label={t('participation.signalements.description')}
          placeholder={t('participation.signalements.descriptionPlaceholder')}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={DESCRIPTION_MAX}
          showCounter
        />
      </View>

      {/* ─── Localisation ────────────────────────────────────────────── */}
      <FieldLabel text={t('participation.signalements.location')} />
      <View style={styles.locationRow}>
        <Input
          placeholder={t('participation.signalements.locationPlaceholder')}
          value={location}
          onChangeText={setLocation}
          icon="location-outline"
          style={styles.locationInput}
        />
        <PressableScale
          onPress={() => {
            // TODO(backend) : géolocalisation via expo-location puis géocodage inverse.
            setLocation('24 Rue de la République');
          }}
          scaleTo={motion.scale.chip}
          accessibilityRole="button"
          accessibilityLabel={t('participation.signalements.useMyPosition')}
          style={[styles.locationButton, { backgroundColor: withAlpha(colors.secondary, 0.14) }]}
        >
          <Ionicons name="locate" size={19} color={colors.secondary} />
        </PressableScale>
      </View>

      {/* ─── Photo ───────────────────────────────────────────────────── */}
      <View style={styles.photoHeader}>
        <FieldLabel text={t('participation.signalements.photo')} inline />
        <Text
          style={{
            color: colors.textTertiary,
            fontSize: getFontSize(typography.sizes.micro),
            fontFamily: typography.families.body,
          }}
        >
          {t('participation.signalements.photoOptional')}
        </Text>
      </View>

      {photoUri ? (
        <View style={styles.photoPreview}>
          <Image source={{ uri: photoUri }} contentFit="cover" style={styles.photoImage} />
          <View style={styles.photoOverlayActions}>
            <PressableScale
              onPress={handlePickPhoto}
              scaleTo={motion.scale.chip}
              accessibilityRole="button"
              accessibilityLabel={t('participation.signalements.changePhoto')}
              style={[styles.photoAction, { backgroundColor: withAlpha('#000000', 0.6) }]}
            >
              <Ionicons name="swap-horizontal" size={17} color="#FFFFFF" />
            </PressableScale>
            <PressableScale
              onPress={() => setPhotoUri(null)}
              scaleTo={motion.scale.chip}
              accessibilityRole="button"
              accessibilityLabel={t('participation.signalements.removePhoto')}
              style={[styles.photoAction, { backgroundColor: withAlpha('#000000', 0.6) }]}
            >
              <Ionicons name="trash-outline" size={17} color="#FFFFFF" />
            </PressableScale>
          </View>
        </View>
      ) : (
        <PressableScale
          onPress={handlePickPhoto}
          scaleTo={motion.scale.card}
          accessibilityRole="button"
          accessibilityLabel={t('participation.signalements.addPhoto')}
          style={[
            styles.photoPicker,
            {
              backgroundColor: withAlpha(colors.primary, 0.04),
              borderColor: withAlpha(colors.primary, 0.28),
            },
          ]}
        >
          <View style={[styles.photoIcon, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
            <Ionicons name="camera-outline" size={20} color={colors.primary} />
          </View>
          <Text
            style={{
              color: colors.primary,
              fontSize: getFontSize(typography.sizes.bodySmall),
              fontFamily: typography.families.bodySemiBold,
            }}
          >
            {t('participation.signalements.addPhoto')}
          </Text>
        </PressableScale>
      )}

      {error ? (
        <Animated.View
          entering={enterFade()}
          style={[styles.error, { backgroundColor: withAlpha(colors.error, 0.1) }]}
          accessibilityLiveRegion="assertive"
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
            {error}
          </Text>
        </Animated.View>
      ) : null}

      <Button
        label={t('participation.signalements.submit')}
        onPress={handleSubmit}
        icon="send"
        iconPosition="right"
        haptic="success"
        size="lg"
        style={styles.submit}
      />
    </View>
  );
};

// ─── Libellé de champ ───────────────────────────────────────────────
const FieldLabel: React.FC<{ text: string; inline?: boolean }> = ({ text, inline }) => {
  const { colors, getFontSize } = useAccessibility();
  return (
    <Text
      style={[
        styles.fieldLabel,
        !inline && styles.fieldLabelBlock,
        {
          color: colors.textSecondary,
          fontSize: getFontSize(typography.sizes.caption),
          fontFamily: typography.families.bodySemiBold,
        },
      ]}
    >
      {text.toUpperCase()}
    </Text>
  );
};

// ─── Pastille de catégorie ──────────────────────────────────────────
const CategoryChip: React.FC<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isSelected: boolean;
  onPress: () => void;
}> = ({ label, icon, isSelected, onPress }) => {
  const { colors, getFontSize } = useAccessibility();
  const progress = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(isSelected ? 1 : 0, { duration: motion.durations.base });
  }, [isSelected, progress]);

  const chipStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.surfaceElevated, colors.primary]
    ),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [colors.textSecondary, colors.textInverse]),
  }));

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={motion.scale.chip}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.chip, chipStyle]}>
        <Ionicons
          name={icon}
          size={15}
          color={isSelected ? colors.textInverse : colors.textTertiary}
        />
        <Animated.Text
          numberOfLines={1}
          style={[
            {
              fontSize: getFontSize(typography.sizes.caption),
              fontFamily: isSelected
                ? typography.families.bodyBold
                : typography.families.bodyMedium,
            },
            textStyle,
          ]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    lineHeight: 17,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    letterSpacing: 0.8,
  },
  fieldLabelBlock: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  chips: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    paddingRight: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  field: {
    marginTop: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  locationInput: {
    flex: 1,
  },
  locationButton: {
    width: 54,
    height: 54,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  photoPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    height: 88,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  photoIcon: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreview: {
    height: 150,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlayActions: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  photoAction: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  submit: {
    marginTop: spacing.xl,
  },
});

export default SignalementForm;
