import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE = '@gemini_api_key';

interface ApiKeyState {
  apiKey: string;
  saveApiKey: (key: string) => Promise<void>;
  loadApiKey: () => Promise<void>;
  removeApiKey: () => Promise<void>;
}

export const useApiKeyStore = create<ApiKeyState>((set) => ({
  apiKey: '',

  saveApiKey: async (key: string) => {
    await AsyncStorage.setItem(API_KEY_STORAGE, key);
    set({ apiKey: key });
  },

  loadApiKey: async () => {
    try {
      const saved = await AsyncStorage.getItem(API_KEY_STORAGE);
      if (saved) set({ apiKey: saved });
    } catch {}
  },

  removeApiKey: async () => {
    await AsyncStorage.removeItem(API_KEY_STORAGE);
    set({ apiKey: '' });
  },
}));
