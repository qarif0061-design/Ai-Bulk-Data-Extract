import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../hooks/use-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProcessingOverlayProps {
  visible: boolean;
  message?: string;
  currentFile?: string;
  processedFiles?: number;
  totalFiles?: number;
  status?: string;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  visible,
  message = 'Processing...',
  currentFile = '',
  processedFiles = 0,
  totalFiles = 0,
  status = 'processing',
}) => {
  const { colors } = useThemeStore();
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);
  const dotProgress = useSharedValue(0);
  const fadeOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fadeOpacity.value = withTiming(1, { duration: 300 });
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1
      );
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
      dotProgress.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.linear }),
        -1
      );
    } else {
      fadeOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const dot1Opacity = useAnimatedStyle(() => ({
    opacity: interpolate(dotProgress.value, [0, 0.3, 0.6, 1], [0.3, 1, 0.3, 0.3]),
  }));
  const dot2Opacity = useAnimatedStyle(() => ({
    opacity: interpolate(dotProgress.value, [0, 0.3, 0.6, 1], [0.3, 0.3, 1, 0.3]),
  }));
  const dot3Opacity = useAnimatedStyle(() => ({
    opacity: interpolate(dotProgress.value, [0, 0.3, 0.6, 1], [0.3, 0.3, 0.3, 1]),
  }));

  if (!visible) return null;

  const progress = totalFiles > 0 ? processedFiles / totalFiles : 0;

  return (
    <Animated.View style={[styles.overlay, backdropStyle]}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Animated.View style={[styles.ringOuter, pulseStyle]}>
          <View style={[styles.ringInner, { borderColor: colors.primaryLight }]}>
            <Animated.View style={[styles.arc, { borderTopColor: colors.primary }, ringStyle]} />
          </View>
          <View style={[styles.iconCenter, { backgroundColor: colors.primaryLight }]}>
            {status === 'completed' ? (
              <MaterialCommunityIcons name="check-bold" size={32} color={colors.success} />
            ) : status === 'failed' ? (
              <MaterialCommunityIcons name="alert" size={32} color={colors.error} />
            ) : (
              <MaterialCommunityIcons name="file-document-outline" size={28} color={colors.primary} />
            )}
          </View>
        </Animated.View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>{message}</Text>

        {currentFile ? (
          <Text style={[styles.fileName, { color: colors.textSecondary }]} numberOfLines={1}>
            {currentFile}
          </Text>
        ) : null}

        {totalFiles > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress * 100}%` as any }]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {processedFiles} of {totalFiles} files
            </Text>
          </View>
        )}

        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { backgroundColor: colors.primary }, dot1Opacity]} />
          <Animated.View style={[styles.dot, { backgroundColor: colors.primary }, dot2Opacity]} />
          <Animated.View style={[styles.dot, { backgroundColor: colors.primary }, dot3Opacity]} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    width: SCREEN_WIDTH - 64,
    borderRadius: 28,
    padding: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
  },
  ringOuter: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  ringInner: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    overflow: 'hidden',
  },
  arc: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderTopColor: '#4F6BED',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  iconCenter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  fileName: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: '90%',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
