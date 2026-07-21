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
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (user: User, token: string) => Promise<void>;
  clearSession: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  loadSession: () => Promise<void>;
}

const SECURE_TOKEN_KEY = 'algodemo_jwt_token';
const SECURE_USER_KEY = 'algodemo_user_profile';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setSession: async (user, token) => {
    try {
      await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token);
      await SecureStore.setItemAsync(SECURE_USER_KEY, JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Erreur de stockage de session:', error);
    }
  },

  clearSession: async () => {
    try {
      await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
      await SecureStore.deleteItemAsync(SECURE_USER_KEY);
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
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
      const token = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(SECURE_USER_KEY);

      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la session:', error);
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
