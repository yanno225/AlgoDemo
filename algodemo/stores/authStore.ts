import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  email?: string;
  phone?: string;
  role: 'standard' | 'point_focal' | 'admin_labo';
  isActive: boolean;
  avatarUri?: string;
}

interface AuthState {
  user: User | null;
  /** Jeton d'accès (courte durée). Alias historique : `token`. */
  accessToken: string | null;
  token: string | null;
  /** Jeton de rafraîchissement (longue durée) — sert à renouveler l'accès. */
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (user: User, accessToken: string, refreshToken?: string) => Promise<void>;
  /** Met à jour les jetons après un rafraîchissement, sans toucher au profil. */
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  clearSession: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  loadSession: () => Promise<void>;
}

const SECURE_ACCESS_KEY = 'algodemo_access_token';
const SECURE_REFRESH_KEY = 'algodemo_refresh_token';
const SECURE_USER_KEY = 'algodemo_user_profile';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  token: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  setSession: async (user, accessToken, refreshToken) => {
    try {
      await SecureStore.setItemAsync(SECURE_ACCESS_KEY, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(SECURE_REFRESH_KEY, refreshToken);
      }
      await SecureStore.setItemAsync(SECURE_USER_KEY, JSON.stringify(user));
      set({
        user,
        accessToken,
        token: accessToken,
        refreshToken: refreshToken ?? get().refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Erreur de stockage de session:', error);
    }
  },

  setTokens: async (accessToken, refreshToken) => {
    try {
      await SecureStore.setItemAsync(SECURE_ACCESS_KEY, accessToken);
      await SecureStore.setItemAsync(SECURE_REFRESH_KEY, refreshToken);
      set({ accessToken, token: accessToken, refreshToken });
    } catch (error) {
      console.error('Erreur de mise à jour des jetons:', error);
    }
  },

  clearSession: async () => {
    try {
      await SecureStore.deleteItemAsync(SECURE_ACCESS_KEY);
      await SecureStore.deleteItemAsync(SECURE_REFRESH_KEY);
      await SecureStore.deleteItemAsync(SECURE_USER_KEY);
      set({
        user: null,
        accessToken: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Erreur de suppression de session:', error);
    }
  },

  updateUser: (updatedUser) => {
    set((state) => {
      if (!state.user) return state;
      const newUser = { ...state.user, ...updatedUser };
      SecureStore.setItemAsync(SECURE_USER_KEY, JSON.stringify(newUser));
      return { user: newUser };
    });
  },

  loadSession: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(SECURE_ACCESS_KEY);
      const refreshToken = await SecureStore.getItemAsync(SECURE_REFRESH_KEY);
      const userStr = await SecureStore.getItemAsync(SECURE_USER_KEY);

      if (accessToken && userStr) {
        const user = JSON.parse(userStr) as User;
        set({
          user,
          accessToken,
          token: accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la session:', error);
      set({ isAuthenticated: false, isLoading: false });
    }
  },
}));
