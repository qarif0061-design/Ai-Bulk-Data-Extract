export const FILE_LIMITS = {
  maxFileSizeMB: 20,
  maxFilesPerJob: 10,
  maxTotalSizeMB: 50,
};

export const SUPPORTED_FILE_TYPES = {
  documents: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/tiff'],
  extensions: ['.pdf', '.png', '.jpeg', '.jpg', '.webp', '.tiff'],
  mimeTypes: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/tiff',
  ],
};

export const CREDIT_AMOUNTS = {
  perFile: 1,
  customModeMultiplier: 2,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  INR: '₹',
  CAD: 'C$',
  AUD: 'A$',
};

export const APP_COLORS = {
  primary: '#1A73E8',
  primaryLight: '#E6F0FE',
  background: '#F8FAFB',
  surface: '#FFFFFF',
  textPrimary: '#202124',
  textSecondary: '#5F6368',
  success: '#34A853',
  warning: '#FBBC04',
  error: '#EA4335',
  border: '#E0E0E0',
};
