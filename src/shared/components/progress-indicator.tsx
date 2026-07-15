import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../hooks/use-theme';

interface ProgressIndicatorProps {
  progress: number;
  showLabel?: boolean;
  height?: number;
  color?: string;
  trackColor?: string;
  style?: ViewStyle;
}

export function ProgressIndicator({ progress, showLabel = false, height = 8, color, trackColor, style }: ProgressIndicatorProps) {
  const { colors } = useThemeStore();
  const fillColor = color || colors.primary;
  const bgColor = trackColor || colors.surfaceVariant;
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { height, backgroundColor: bgColor, borderRadius: height / 2 }]}>
        <View style={[styles.fill, { height, backgroundColor: fillColor, borderRadius: height / 2, width: `${clampedProgress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  track: { width: '100%', overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0 },
});
