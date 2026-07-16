export const FIREBASE_CONFIG = {
  apiKey: {
    web: 'AIzaSyD0L5qly0KIhAZilFUb2uJzmhceGXhIRZQ',
    android: 'AIzaSyA1gZ9UtOm9L5gXPQsi95t_GJnA4KoD1gw',
    ios: 'AIzaSyCkaV6oFIrAmtAvKXxDrxlO4Tx0WpOB-ZY',
  },
  appId: {
    web: '1:574020111117:web:e1324b389fd3ec27eb3e44',
    android: '1:574020111117:android:479b1815acffc6afeb3e44',
    ios: '1:574020111117:ios:ad1008e1e00dabf0eb3e44',
  },
  messagingSenderId: '574020111117',
  projectId: 'ai-bulk-data-extracter',
  storageBucket: 'ai-bulk-data-extracter.firebasestorage.app',
  authDomain: 'ai-bulk-data-extracter.firebaseapp.com',
};

export const AI_CONFIG = {
  geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
  geminiModel: 'gemini-2.0-flash',
  geminiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',

  openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
  openaiModel: 'gpt-4o-mini',
  openaiBaseUrl: 'https://api.openai.com/v1',

  anthropicApiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
  anthropicModel: 'claude-3-5-haiku-20241022',
  anthropicBaseUrl: 'https://api.anthropic.com/v1',

  maxTokens: 4096,
  temperature: 0.1,
};

export const APP_CONFIG = {
  name: 'AI Bulk Data Extractor',
  version: '1.0.0',
  iosBundleId: 'com.aibulkdataextractor.aiBulkDataExtractor',
  androidPackage: 'com.aibulkdataextractor.aiBulkDataExtractor',
};
