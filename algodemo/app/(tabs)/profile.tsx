import React from 'react';
import { StyleSheet, View, Text, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useAuthStore } from '../../stores/authStore';
import { Screen, TAB_BAR_CLEARANCE } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { enterListItem, enterSection } from '../../components/ui/motion';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  motion,
  thematicGradients,
  withAlpha,
} from '../../constants/theme';

const FONT_SCALE_MIN = 0.8;
const FONT_SCALE_MAX = 1.6;
const FONT_SCALE_STEP = 0.1;

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, updateUser, clearSession } = useAuthStore();
  const {
    colors,
    getFontSize,
    fontScaleMultiplier,
    highContrast,
    autoReadTTS,
    increaseHitSlops,
    setFontScaleMultiplier,
    toggleHighContrast,
    toggleAutoReadTTS,
    toggleIncreaseHitSlops,
  } = useAccessibility();

  const [isLogoutConfirmVisible, setLogoutConfirmVisible] = React.useState(false);

  const handleLogout = async () => {
    setLogoutConfirmVisible(false);
    await clearSession();
    router.replace('/login');
  };

  const changeFontScale = (increase: boolean) => {
    void Haptics.selectionAsync();
    const next = increase
      ? Math.min(fontScaleMultiplier + FONT_SCALE_STEP, FONT_SCALE_MAX)
      : Math.max(fontScaleMultiplier - FONT_SCALE_STEP, FONT_SCALE_MIN);
    setFontScaleMultiplier(Number(next.toFixed(1)));
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      updateUser({ avatarUri: result.assets[0].uri });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '';

  return (
    <Screen edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE + insets.bottom }}
      >
        {/* ─── Bandeau d'identité ──────────────────────────────────── */}
        <LinearGradient
          colors={thematicGradients.brand}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.cover, { paddingTop: insets.top + spacing.md }]}
        >
          <View style={styles.coverTop}>
            <View style={styles.brandRow}>
              <MaterialCommunityIcons name="scale-balance" size={18} color="#FFFFFF" />
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.headingSemiBold,
                }}
              >
                {t('auth.brand.name')}
              </Text>
            </View>

            <PressableScale
              onPress={() => router.push('/settings')}
              scaleTo={motion.scale.chip}
              accessibilityRole="button"
              accessibilityLabel={t('profile.openSettings')}
              style={[styles.iconButton, { backgroundColor: withAlpha('#FFFFFF', 0.18) }]}
            >
              <Ionicons name="settings-outline" size={19} color="#FFFFFF" />
            </PressableScale>
          </View>
        </LinearGradient>

        {isAuthenticated && user ? (
          <>
            {/* L'avatar chevauche le bandeau : il relie l'identité à la
                fiche et évite la rupture nette entre les deux zones. */}
            <Animated.View entering={enterSection(60)} style={styles.identity}>
              <PressableScale
                onPress={pickAvatar}
                scaleTo={motion.scale.chip}
                haptic="medium"
                accessibilityRole="imagebutton"
                accessibilityLabel={t('profile.editPhoto')}
                style={styles.avatarWrapper}
              >
                {user.avatarUri ? (
                  <Image
                    source={{ uri: user.avatarUri }}
                    contentFit="cover"
                    transition={200}
                    style={[styles.avatar, { borderColor: colors.background }]}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      styles.avatarFallback,
                      { backgroundColor: colors.primaryMedium, borderColor: colors.background },
                    ]}
                  >
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: getFontSize(typography.sizes.h2),
                        fontFamily: typography.families.heading,
                      }}
                    >
                      {initials}
                    </Text>
                  </View>
                )}

                <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                  <Ionicons name="camera" size={13} color="#FFFFFF" />
                </View>
              </PressableScale>

              <View style={styles.nameRow}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: getFontSize(typography.sizes.h3),
                    fontFamily: typography.families.heading,
                  }}
                >
                  {user.firstName} {user.lastName}
                </Text>
                <MaterialCommunityIcons name="check-decagram" size={19} color={colors.verified} />
              </View>

              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: getFontSize(typography.sizes.bodySmall),
                  fontFamily: typography.families.body,
                }}
              >
                {t('profile.memberSince', { year: 2022 })}
              </Text>
            </Animated.View>

            {/* ─── Statistiques ──────────────────────────────────────── */}
            <Animated.View entering={enterListItem(1)} style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.surface }, shadows.md]}>
                <Text
                  style={[
                    styles.statLabel,
                    {
                      color: colors.textTertiary,
                      fontSize: getFontSize(typography.sizes.micro),
                      fontFamily: typography.families.bodyBold,
                    },
                  ]}
                >
                  {t('profile.contributions').toUpperCase()}
                </Text>
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: getFontSize(typography.sizes.h2),
                    fontFamily: typography.families.heading,
                  }}
                >
                  142
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.surface }, shadows.md]}>
                <Text
                  style={[
                    styles.statLabel,
                    {
                      color: colors.textTertiary,
                      fontSize: getFontSize(typography.sizes.micro),
                      fontFamily: typography.families.bodyBold,
                    },
                  ]}
                >
                  {t('profile.reliability').toUpperCase()}
                </Text>
                <View style={styles.statValueRow}>
                  <Text
                    style={{
                      color: colors.secondary,
                      fontSize: getFontSize(typography.sizes.h2),
                      fontFamily: typography.families.heading,
                    }}
                  >
                    98%
                  </Text>
                  <MaterialCommunityIcons name="shield-check" size={18} color={colors.secondary} />
                </View>
              </View>
            </Animated.View>

            {/* ─── Badges ────────────────────────────────────────────── */}
            <Animated.View entering={enterListItem(2)} style={styles.section}>
              <SectionHeader
                title={t('profile.badgesTitle')}
                actionLabel={t('profile.seeAll')}
                onActionPress={() => {
                  /* TODO(backend) : galerie complète des badges obtenus */
                }}
                style={styles.sectionHeader}
              />

              <View style={styles.badgesRow}>
                <Badge icon="trophy" label={t('profile.badges.pioneer')} tint={colors.primary} />
                <Badge icon="handshake" label={t('profile.badges.moderator')} tint={colors.secondary} />
                <Badge icon="playlist-check" label={t('profile.badges.verifier')} tint={colors.info} />
                <Badge icon="school" label={t('profile.badges.expert')} tint={colors.textTertiary} locked />
              </View>
            </Animated.View>

            {/* ─── Activité ──────────────────────────────────────────── */}
            <Animated.View entering={enterListItem(3)} style={styles.section}>
              <SectionHeader title={t('profile.activityTitle')} style={styles.sectionHeader} />

              <View style={[styles.activityCard, { backgroundColor: colors.surface }, shadows.md]}>
                <CircularProgress
                  percentage={82}
                  label={t('profile.activity.votes')}
                  color={colors.primary}
                  delay={100}
                />
                <CircularProgress
                  percentage={65}
                  label={t('profile.activity.watch')}
                  color={colors.secondary}
                  delay={200}
                />
                <CircularProgress
                  percentage={48}
                  label={t('profile.activity.lives')}
                  color={colors.info}
                  delay={300}
                />
              </View>
            </Animated.View>
          </>
        ) : (
          /* RG-USR-05 : le fil est public, le profil suppose une session. */
          <Animated.View entering={enterSection(60)} style={styles.guest}>
            <View style={[styles.guestIcon, { backgroundColor: colors.primaryPale }]}>
              <Ionicons name="person-outline" size={34} color={colors.primary} />
            </View>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: getFontSize(typography.sizes.h4),
                fontFamily: typography.families.headingSemiBold,
                textAlign: 'center',
              }}
            >
              {t('profile.guestTitle')}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: getFontSize(typography.sizes.bodySmall),
                fontFamily: typography.families.body,
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              {t('profile.guestSubtitle')}
            </Text>
            <Button
              label={t('profile.guestAction')}
              onPress={() => router.replace('/login')}
              size="lg"
              haptic="medium"
              style={styles.guestButton}
            />
          </Animated.View>
        )}

        {/* ─── Accessibilité ─────────────────────────────────────────── */}
        <Animated.View entering={enterListItem(4)} style={styles.section}>
          <SectionHeader title={t('profile.accessibilityTitle')} style={styles.sectionHeader} />

          <View style={[styles.settingsCard, { backgroundColor: colors.surface }, shadows.md]}>
            <View style={styles.settingRow}>
              <SettingText
                title={t('profile.accessibility.fontSize')}
                description={t('profile.accessibility.fontSizeDesc')}
              />
              <View style={styles.stepper}>
                <PressableScale
                  onPress={() => changeFontScale(false)}
                  disabled={fontScaleMultiplier <= FONT_SCALE_MIN}
                  scaleTo={motion.scale.chip}
                  haptic="none"
                  accessibilityRole="button"
                  accessibilityLabel={t('profile.accessibility.decrease')}
                  style={[styles.stepperButton, { backgroundColor: colors.surfaceElevated }]}
                >
                  <Ionicons
                    name="remove"
                    size={17}
                    color={
                      fontScaleMultiplier <= FONT_SCALE_MIN ? colors.textTertiary : colors.textPrimary
                    }
                  />
                </PressableScale>

                <Text
                  style={[
                    styles.stepperValue,
                    {
                      color: colors.textPrimary,
                      fontSize: getFontSize(typography.sizes.caption),
                      fontFamily: typography.families.bodyBold,
                    },
                  ]}
                >
                  {Math.round(fontScaleMultiplier * 100)}%
                </Text>

                <PressableScale
                  onPress={() => changeFontScale(true)}
                  disabled={fontScaleMultiplier >= FONT_SCALE_MAX}
                  scaleTo={motion.scale.chip}
                  haptic="none"
                  accessibilityRole="button"
                  accessibilityLabel={t('profile.accessibility.increase')}
                  style={[styles.stepperButton, { backgroundColor: colors.surfaceElevated }]}
                >
                  <Ionicons
                    name="add"
                    size={17}
                    color={
                      fontScaleMultiplier >= FONT_SCALE_MAX ? colors.textTertiary : colors.textPrimary
                    }
                  />
                </PressableScale>
              </View>
            </View>

            <Divider />

            <ToggleRow
              title={t('profile.accessibility.contrast')}
              description={t('profile.accessibility.contrastDesc')}
              value={highContrast}
              onToggle={toggleHighContrast}
            />

            <Divider />

            <ToggleRow
              title={t('profile.accessibility.tts')}
              description={t('profile.accessibility.ttsDesc')}
              value={autoReadTTS}
              onToggle={toggleAutoReadTTS}
            />

            <Divider />

            <ToggleRow
              title={t('profile.accessibility.hitSlop')}
              description={t('profile.accessibility.hitSlopDesc')}
              value={increaseHitSlops}
              onToggle={toggleIncreaseHitSlops}
            />
          </View>
        </Animated.View>

        {isAuthenticated && (
          <Animated.View entering={enterListItem(5)} style={styles.section}>
            <Button
              label={t('profile.logout')}
              onPress={() => setLogoutConfirmVisible(true)}
              variant="outline"
              icon="log-out-outline"
              haptic="light"
              textStyle={{ color: colors.error }}
              style={[styles.logout, { borderColor: colors.error }]}
            />
          </Animated.View>
        )}
      </ScrollView>

      {/* La déconnexion est confirmée explicitement : elle vide la session
          sécurisée et peut interrompre une synchronisation en attente. */}
      <ConfirmDialog
        visible={isLogoutConfirmVisible}
        icon="log-out-outline"
        tone="danger"
        title={t('profile.logoutConfirm.title')}
        message={t('profile.logoutConfirm.message')}
        cancelLabel={t('profile.logoutConfirm.cancel')}
        confirmLabel={t('profile.logoutConfirm.confirm')}
        onCancel={() => setLogoutConfirmVisible(false)}
        onConfirm={handleLogout}
      />
    </Screen>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────
const Badge: React.FC<{
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  tint: string;
  locked?: boolean;
}> = ({ icon, label, tint, locked = false }) => {
  const { colors, getFontSize } = useAccessibility();
  const { t } = useTranslation();

  return (
    <View style={styles.badge}>
      <View
        style={[
          styles.badgeCircle,
          {
            backgroundColor: locked ? colors.surfaceElevated : withAlpha(tint, 0.14),
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={locked ? colors.textTertiary : tint}
        />
      </View>
      <Text
        numberOfLines={1}
        style={{
          color: locked ? colors.textTertiary : colors.textPrimary,
          fontSize: getFontSize(typography.sizes.micro),
          fontFamily: typography.families.bodySemiBold,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
      {locked && (
        <Text
          style={{
            color: colors.textTertiary,
            fontSize: getFontSize(typography.sizes.micro) - 1,
            fontFamily: typography.families.body,
          }}
        >
          {t('profile.badges.locked')}
        </Text>
      )}
    </View>
  );
};

const SettingText: React.FC<{ title: string; description: string }> = ({ title, description }) => {
  const { colors, getFontSize } = useAccessibility();
  return (
    <View style={styles.settingText}>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: getFontSize(typography.sizes.bodySmall),
          fontFamily: typography.families.bodySemiBold,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: getFontSize(typography.sizes.caption),
          fontFamily: typography.families.body,
          lineHeight: 16,
          marginTop: 2,
        }}
      >
        {description}
      </Text>
    </View>
  );
};

const ToggleRow: React.FC<{
  title: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}> = ({ title, description, value, onToggle }) => {
  const { colors } = useAccessibility();

  return (
    <View style={styles.settingRow}>
      <SettingText title={title} description={description} />
      <Switch
        value={value}
        onValueChange={() => {
          void Haptics.selectionAsync();
          onToggle();
        }}
        trackColor={{ false: colors.border, true: colors.primaryMedium }}
        thumbColor={colors.surface}
        accessibilityLabel={title}
      />
    </View>
  );
};

const Divider: React.FC = () => {
  const { colors } = useAccessibility();
  return <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />;
};

const styles = StyleSheet.create({
  cover: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.massive + spacing.lg,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  coverTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  identity: {
    alignItems: 'center',
    marginTop: -spacing.massive,
    paddingHorizontal: spacing.lg,
  },
  avatarWrapper: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: borderRadius.full,
    borderWidth: 4,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  statLabel: {
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  badge: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeCircle: {
    width: 54,
    height: 54,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityCard: {
    flexDirection: 'row',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
  },
  settingsCard: {
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  settingText: {
    flex: 1,
  },
  divider: {
    height: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    minWidth: 40,
    textAlign: 'center',
  },
  guest: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    marginTop: -spacing.massive,
  },
  guestIcon: {
    width: 84,
    height: 84,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  guestButton: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
  logout: {
    marginTop: spacing.xs,
  },
});
