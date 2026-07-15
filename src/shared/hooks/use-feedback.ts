import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RATING_KEY = '@has_rated_extraction';

interface FeedbackState {
  hasRated: boolean;
  loadRating: () => Promise<void>;
  markRated: () => Promise<void>;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  hasRated: false,

  loadRating: async () => {
    try {
      const val = await AsyncStorage.getItem(RATING_KEY);
      if (val === 'true') set({ hasRated: true });
    } catch {}
  },

  markRated: async () => {
    try {
      await AsyncStorage.setItem(RATING_KEY, 'true');
      set({ hasRated: true });
    } catch {}
  },
}));
