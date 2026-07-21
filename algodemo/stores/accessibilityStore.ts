import { create } from 'zustand';

interface AccessibilityState {
  fontScaleMultiplier: number;
  highContrast: boolean;
  autoReadTTS: boolean;
  increaseHitSlops: boolean;
  setFontScaleMultiplier: (multiplier: number) => void;
  toggleHighContrast: () => void;
  toggleAutoReadTTS: () => void;
  toggleIncreaseHitSlops: () => void;
  resetAccessibility: () => void;
}

export const useAccessibilityStore = create<AccessibilityState>((set) => ({
  fontScaleMultiplier: 1.0, // Multiplicateur de taille de police (ex: 1.0, 1.2, 1.4)
  highContrast: false,      // Mode contrastes élevés
  autoReadTTS: false,       // Lire automatiquement le texte lors du focus
  increaseHitSlops: false,  // Zones de toucher encore plus larges (pour personnes avec difficultés motrices)

  setFontScaleMultiplier: (multiplier) => set({ fontScaleMultiplier: multiplier }),
  toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
  toggleAutoReadTTS: () => set((state) => ({ autoReadTTS: !state.autoReadTTS })),
  toggleIncreaseHitSlops: () => set((state) => ({ increaseHitSlops: !state.increaseHitSlops })),

  resetAccessibility: () => set({
    fontScaleMultiplier: 1.0,
    highContrast: false,
    autoReadTTS: false,
    increaseHitSlops: false,
  }),
}));
