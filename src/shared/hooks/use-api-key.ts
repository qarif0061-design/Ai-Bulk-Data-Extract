import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE = '@openrouter_api_key';

interface ApiKeyState {
  apiKey: string;
  setApiKey: (key: string) => Promise<void>;
  loadApiKey: () => Promise<void>;
  clearApiKey: () => Promise<void>;
}

export const useApiKeyStore = create<ApiKeyState>((set) => ({
  apiKey: '',

  setApiKey: async (key: string) => {
    await AsyncStorage.setItem(API_KEY_STORAGE, key);
    set({ apiKey: key });
  },

  loadApiKey: async () => {
    try {
      const saved = await AsyncStorage.getItem(API_KEY_STORAGE);
      if (saved) set({ apiKey: saved });
    } catch {}
  },

  clearApiKey: async () => {
    await AsyncStorage.removeItem(API_KEY_STORAGE);
    set({ apiKey: '' });
  },
}));
