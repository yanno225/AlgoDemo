import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

/**
 * Suivi de l'écran de lancement.
 *
 * L'écran d'accueil n'est présenté qu'une fois par installation : une fois
 * l'utilisateur passé par « Démarrer », le rejouer à chaque ouverture
 * n'apporterait rien et retarderait l'accès à l'application.
 *
 * Le drapeau est persisté dans SecureStore, au même titre que la session,
 * pour survivre au redémarrage de l'application.
 */

interface OnboardingState {
  /** `null` tant que la valeur persistée n'a pas été relue au démarrage. */
  hasCompleted: boolean | null;
  isLoading: boolean;
  loadOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const SECURE_ONBOARDING_KEY = 'algodemo_onboarding_done';

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasCompleted: null,
  isLoading: true,

  loadOnboarding: async () => {
    try {
      const value = await SecureStore.getItemAsync(SECURE_ONBOARDING_KEY);
      set({ hasCompleted: value === 'true', isLoading: false });
    } catch (error) {
      // En cas de lecture impossible, on considère l'accueil non vu : mieux
      // vaut le présenter une fois de trop que de sauter la sélection de langue.
      console.error("Erreur de lecture de l'état d'accueil :", error);
      set({ hasCompleted: false, isLoading: false });
    }
  },

  completeOnboarding: async () => {
    // On met à jour l'état local immédiatement pour une navigation fluide,
    // la persistance suit sans bloquer la transition.
    set({ hasCompleted: true });
    try {
      await SecureStore.setItemAsync(SECURE_ONBOARDING_KEY, 'true');
    } catch (error) {
      console.error("Erreur d'enregistrement de l'état d'accueil :", error);
    }
  },
}));
