import React from 'react';
import { Stack } from 'expo-router';
import { useAccessibility } from '../../hooks/useAccessibility';

export default function AuthLayout() {
  const { colors } = useAccessibility();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="otp" />
    </Stack>
  );
}
