export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySurface: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textOnPrimary: string;
  textInverse: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  border: string;
  borderLight: string;
  divider: string;
  shadow: string;
  overlay: string;
  overlayLight: string;
  tabActive: string;
  tabInactive: string;
  googleBlue: string;
  googleRed: string;
  googleYellow: string;
  googleGreen: string;
  card: string;
  cardBorder: string;
  gradientStart: string;
  gradientEnd: string;
  gradientPrimary: string[];
  headerBg: string;
  inputBg: string;
  badgeBg: string;
}

const lightColors: ThemeColors = {
  primary: '#4F6BED',
  primaryDark: '#3B52CC',
  primaryLight: '#EEF1FE',
  primarySurface: '#D6DCF9',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F2F5',
  textPrimary: '#1A1D26',
  textSecondary: '#5F6368',
  textTertiary: '#9AA0A6',
  textOnPrimary: '#FFFFFF',
  textInverse: '#FFFFFF',
  success: '#22C55E',
  successLight: '#F0FDF4',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  info: '#4F6BED',
  infoLight: '#EEF1FE',
  border: '#E2E5EA',
  borderLight: '#ECEEF2',
  divider: '#F0F2F5',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  tabActive: '#4F6BED',
  tabInactive: '#9AA0A6',
  googleBlue: '#4285F4',
  googleRed: '#EA4335',
  googleYellow: '#FBBC04',
  googleGreen: '#34A853',
  card: '#FFFFFF',
  cardBorder: '#ECEEF2',
  gradientStart: '#4F6BED',
  gradientEnd: '#7C3AED',
  gradientPrimary: ['#4F6BED', '#6366F1', '#7C3AED'],
  headerBg: '#F5F7FA',
  inputBg: '#F0F2F5',
  badgeBg: '#EEF1FE',
};

const darkColors: ThemeColors = {
  primary: '#818CF8',
  primaryDark: '#6366F1',
  primaryLight: '#1E1B4B',
  primarySurface: '#272361',
  background: '#0F1117',
  surface: '#1A1D27',
  surfaceVariant: '#252830',
  textPrimary: '#F1F3F5',
  textSecondary: '#A0A4AB',
  textTertiary: '#6B7080',
  textOnPrimary: '#FFFFFF',
  textInverse: '#1A1D26',
  success: '#4ADE80',
  successLight: '#052E16',
  warning: '#FBBF24',
  warningLight: '#451A03',
  error: '#F87171',
  errorLight: '#450A0A',
  info: '#818CF8',
  infoLight: '#1E1B4B',
  border: '#2D3039',
  borderLight: '#252830',
  divider: '#1F222B',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  tabActive: '#818CF8',
  tabInactive: '#6B7080',
  googleBlue: '#60A5FA',
  googleRed: '#F87171',
  googleYellow: '#FBBF24',
  googleGreen: '#4ADE80',
  card: '#1A1D27',
  cardBorder: '#2D3039',
  gradientStart: '#6366F1',
  gradientEnd: '#8B5CF6',
  gradientPrimary: ['#6366F1', '#7C3AED', '#8B5CF6'],
  headerBg: '#0F1117',
  inputBg: '#252830',
  badgeBg: '#1E1B4B',
};

export const Colors = {
  ...lightColors,
  dark: darkColors,
};

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? darkColors : lightColors;
}
