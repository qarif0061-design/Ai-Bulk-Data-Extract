import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../hooks/use-theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const { colors } = useThemeStore();
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon as any} size={56} color={colors.textTertiary} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, minHeight: 300 },
  title: { fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  description: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  action: { marginTop: 24 },
});
