// EN PREMIER : intercepte le faux positif d'expo-notifications dans Expo Go
// avant même que le module ne se charge (voir le fichier pour le pourquoi).
import '../services/console-filtre';
import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useAccessibility } from '../hooks/useAccessibility';
import { installerAffichageNotifications } from '../services/rappels';
import { lightColors, darkColors } from '../constants/theme';
import '../i18n/config';

// Garde le splash screen visible pendant le chargement des ressources
SplashScreen.preventAutoHideAsync();

// Expo Go (SDK 53+) ne fait plus de push DISTANT : à l'import,
// expo-notifications le signale en tentant d'auto-enregistrer un token push.
// Nos rappels de débats sont des notifications LOCALES — elles fonctionnent.
// Le push distant (FCM) arrivera avec le build de développement ; d'ici là,
// ce log est du bruit connu, sans effet, qu'on retire de l'écran.
LogBox.ignoreLogs([
  /expo-notifications.*Expo Go/,
  /`expo-notifications` functionality is not fully supported in Expo Go/,
]);

// Les rappels de débats s'affichent en bannière sonore même app ouverte.
installerAffichageNotifications();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes par défaut
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  const { loadSession, isLoading: isAuthLoading } = useAuthStore();
  const { loadOnboarding, isLoading: isOnboardingLoading } = useOnboardingStore();
  const { isDark } = useAccessibility();

  useEffect(() => {
    // Restaurer en parallèle la session et l'état de l'écran de lancement :
    // l'index a besoin des deux pour décider de la première route.
    loadSession();
    loadOnboarding();
  }, []);

  useEffect(() => {
    // Toucher un rappel de débat mène à l'onglet Débats : s'il est en direct,
    // sa carte y est en tête ; l'écran se recharge à chaque focus.
    const abonnement = Notifications.addNotificationResponseReceivedListener(
      (reponse) => {
        const donnees = reponse.notification.request.content.data as
          | { type?: string }
          | undefined;
        if (donnees?.type === 'rappel-debat') {
          router.push('/(tabs)/debats');
        }
      }
    );
    return () => abonnement.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded && !isAuthLoading && !isOnboardingLoading) {
      // Masquer le splash screen dès que tout est chargé
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isAuthLoading, isOnboardingLoading]);

  if (!fontsLoaded || isAuthLoading || isOnboardingLoading) {
    return null; // On peut retourner un écran de splash personnalisé ici
  }

  return (
    // Requis par react-native-gesture-handler : sans cette racine, les gestes
    // (swipe entre onglets, pull-to-refresh, balayage du feed) ne remontent pas.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        {/* Aligne toutes les animations Reanimated sur le réglage système
            « réduire les animations » : parallaxe, ressorts et pulsations se
            neutralisent d'un coup pour les utilisateurs à troubles
            vestibulaires. Exigence d'accessibilité de la note conceptuelle. */}
        <ReducedMotionConfig mode={ReduceMotion.System} />
        <SafeAreaProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: {
                backgroundColor: isDark ? darkColors.background : lightColors.background,
              },
            }}
          >
            {/* Les groupes d'écrans principaux */}
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          </Stack>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
