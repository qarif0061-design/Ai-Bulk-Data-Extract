import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../hooks/use-theme';

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  borderRadius?: number;
}

export function AppCard({ children, style, padding = 16, borderRadius = 18 }: AppCardProps) {
  const { colors } = useThemeStore();
  return (
    <View style={[styles.card, { padding, borderRadius, backgroundColor: colors.surface, borderColor: colors.cardBorder }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
