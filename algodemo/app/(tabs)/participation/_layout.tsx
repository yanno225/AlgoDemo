import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { Screen } from '../../../components/ui/Screen';
import { ParticipationTabBar } from '../../../components/feature/participation/ParticipationTabBar';
import { enterSection } from '../../../components/ui/motion';
import { spacing, typography, borderRadius } from '../../../constants/theme';

const { Navigator } = createMaterialTopTabNavigator();

/**
 * Onglets supérieurs adossés à expo-router : chaque volet est une route à part
 * entière (`/participation/sondages`, `/participation/consultations`,
 * `/participation/signalements`) et se balaye latéralement.
 */
const MaterialTopTabs = withLayoutContext(Navigator);

export default function ParticipationLayout() {
  const { t } = useTranslation();
  const { colors, getFontSize } = useAccessibility();

  return (
    <Screen>
      <Animated.View entering={enterSection(0)} style={styles.header}>
        <View style={styles.brandRow}>
          <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="scale-balance" size={15} color={colors.textInverse} />
          </View>
          <Text
            style={[
              styles.brandText,
              {
                color: colors.primary,
                fontSize: getFontSize(typography.sizes.bodySmall),
                fontFamily: typography.families.headingSemiBold,
              },
            ]}
          >
            {t('auth.brand.name')}
          </Text>
        </View>

        <Text
          style={[
            styles.title,
            {
              color: colors.textPrimary,
              fontSize: getFontSize(typography.sizes.h2),
              fontFamily: typography.families.heading,
            },
          ]}
        >
          {t('participation.title')}
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
              fontSize: getFontSize(typography.sizes.bodySmall),
              fontFamily: typography.families.body,
            },
          ]}
        >
          {t('participation.subtitle')}
        </Text>
      </Animated.View>

      <MaterialTopTabs
        tabBar={(props) => <ParticipationTabBar {...props} />}
        screenOptions={{ swipeEnabled: true, lazy: true }}
      >
        <MaterialTopTabs.Screen
          name="sondages"
          options={{ title: t('participation.tabs.sondages') }}
        />
        <MaterialTopTabs.Screen
          name="consultations"
          options={{ title: t('participation.tabs.consultations') }}
        />
        <MaterialTopTabs.Screen
          name="signalements"
          options={{ title: t('participation.tabs.signalements') }}
        />
      </MaterialTopTabs>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  brandMark: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {},
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    lineHeight: 19,
  },
});
