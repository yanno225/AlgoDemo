import { create } from 'zustand';
import { ThematicId } from '../constants/thematics';

interface FilterState {
  selectedThematics: ThematicId[];
  searchQuery: string;
  startDate: string | null;
  endDate: string | null;
  toggleThematic: (id: ThematicId) => void;
  setSearchQuery: (query: string) => void;
  setDateRange: (start: string | null, end: string | null) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedThematics: [],
  searchQuery: '',
  startDate: null,
  endDate: null,

  toggleThematic: (id) =>
    set((state) => {
      const isSelected = state.selectedThematics.includes(id);
      const newSelection = isSelected
        ? state.selectedThematics.filter((item) => item !== id)
        : [...state.selectedThematics, id];
      return { selectedThematics: newSelection };
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setDateRange: (start, end) => set({ startDate: start, endDate: end }),

  resetFilters: () =>
    set({
      selectedThematics: [],
      searchQuery: '',
      startDate: null,
      endDate: null,
    }),
}));
