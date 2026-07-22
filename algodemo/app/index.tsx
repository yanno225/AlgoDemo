import React from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useAccessibility } from '../hooks/useAccessibility';

export default function EntryPoint() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { hasCompleted } = useOnboardingStore();
  const { colors } = useAccessibility();

  // Les deux drapeaux sont restaurés dans le layout racine ; ce garde-fou
  // couvre le bref instant où l'index se rend avant leur résolution.
  if (isLoading || hasCompleted === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Un compte déjà connecté rejoint directement le fil : l'accueil ne
  // concerne que la première prise en main.
  if (isAuthenticated) {
    return <Redirect href="/feed" />;
  }

  // Première ouverture : écran de lancement, puis authentification.
  if (!hasCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/login" />;
}
