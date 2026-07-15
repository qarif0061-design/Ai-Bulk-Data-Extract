import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode, getThemeColors, ThemeColors } from '../theme/colors';

const THEME_KEY = '@app_theme_mode';

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light',
  colors: getThemeColors('light'),

  toggleTheme: () => {
    set((state) => {
      const newMode = state.mode === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(THEME_KEY, newMode).catch(() => {});
      return { mode: newMode, colors: getThemeColors(newMode) };
    });
  },

  setTheme: (mode: ThemeMode) => {
    AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
    set({ mode, colors: getThemeColors(mode) });
  },

  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') {
        set({ mode: saved, colors: getThemeColors(saved) });
      }
    } catch {}
  },
}));
