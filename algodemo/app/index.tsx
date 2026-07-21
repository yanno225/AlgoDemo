import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { View, ActivityIndicator } from 'react-native';
import { useAccessibility } from '../hooks/useAccessibility';

export default function EntryPoint() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { colors } = useAccessibility();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Redirection automatique selon l'état de la session
  if (isAuthenticated) {
    return <Redirect href="/feed" />;
  }

  return <Redirect href="/login" />;
}
