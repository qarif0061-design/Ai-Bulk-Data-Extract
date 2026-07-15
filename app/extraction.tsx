import React, { useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useExtractionStore } from '../src/features/extraction/extraction-store';
import { useThemeStore } from '../src/shared/hooks/use-theme';
import { FadeInView } from '../src/shared/components/animated';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';

export default function ExtractionScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { isProcessing, progress, currentJobId, result, error } = useExtractionStore();

  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);
  const dotAnim = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    dotAnim.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1
    );
  }, []);

  useEffect(() => {
    if (!isProcessing && currentJobId) {
      if (result && Object.keys(result).length > 0) {
        router.replace(`/results/${currentJobId}`);
      } else {
        Alert.alert('No Data', 'Could not extract any text from the uploaded files. Try PDFs with selectable text or clearer images.', [
          { text: 'Go Back', onPress: () => router.back() },
        ]);
      }
    }
  }, [isProcessing, currentJobId, result, error]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => isProcessing);
    return () => backHandler.remove();
  }, [isProcessing]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const dot1 = useAnimatedStyle(() => ({
    opacity: interpolate(dotAnim.value, [0, 0.3, 0.6, 1], [0.3, 1, 0.3, 0.3]),
  }));
  const dot2 = useAnimatedStyle(() => ({
    opacity: interpolate(dotAnim.value, [0, 0.3, 0.6, 1], [0.3, 0.3, 1, 0.3]),
  }));
  const dot3 = useAnimatedStyle(() => ({
    opacity: interpolate(dotAnim.value, [0, 0.3, 0.6, 1], [0.3, 0.3, 0.3, 1]),
  }));

  const progressPercent = progress ? Math.round((progress.processedFiles / Math.max(progress.totalFiles, 1)) * 100) : 0;
  const statusColor = progress?.status === 'completed' ? colors.success : progress?.status === 'failed' ? colors.error : colors.primary;

  const getStatusMessage = () => {
    if (progress?.status === 'completed') return 'Extraction Complete!';
    if (progress?.status === 'failed') return 'Extraction Failed';
    if (progress?.status === 'merging') return 'Merging Results...';
    return 'Extracting Data...';
  };

  const getStatusIcon = () => {
    if (progress?.status === 'completed') return 'check-bold';
    if (progress?.status === 'failed') return 'alert';
    return 'file-document-outline';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <FadeInView delay={0}>
          <Animated.View style={[styles.ringOuter, pulseStyle]}>
            <View style={[styles.ringInner, { borderColor: colors.primaryLight }]}>
              <Animated.View style={[styles.arc, { borderTopColor: statusColor }, ringStyle]} />
            </View>
            <View style={[styles.iconCenter, { backgroundColor: statusColor + '20' }]}>
              <MaterialCommunityIcons name={getStatusIcon() as any} size={36} color={statusColor} />
            </View>
          </Animated.View>
        </FadeInView>

        <FadeInView delay={150}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{getStatusMessage()}</Text>
        </FadeInView>

        <FadeInView delay={250}>
          {progress && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {progress.currentFile ? progress.currentFile : `${progress.processedFiles} of ${progress.totalFiles} files`}
            </Text>
          )}
        </FadeInView>

        <FadeInView delay={350}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
              <LinearGradient
                colors={[colors.primary, statusColor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progressPercent}%` as any, backgroundColor: statusColor }]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>{progressPercent}%</Text>
          </View>
        </FadeInView>

        {progress?.totalFiles ? (
          <FadeInView delay={400}>
            <View style={styles.statsRow}>
              <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{progress.processedFiles}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Processed</Text>
              </View>
              <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <Text style={[styles.statValue, { color: colors.textTertiary }]}>{progress.totalFiles - progress.processedFiles}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Remaining</Text>
              </View>
            </View>
          </FadeInView>
        ) : null}

        {(error || progress?.error) && (
          <FadeInView delay={0}>
            <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]} numberOfLines={4}>{error || progress?.error}</Text>
            </View>
          </FadeInView>
        )}

        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { backgroundColor: statusColor }, dot1]} />
          <Animated.View style={[styles.dot, { backgroundColor: statusColor }, dot2]} />
          <Animated.View style={[styles.dot, { backgroundColor: statusColor }, dot3]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  ringOuter: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  ringInner: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    overflow: 'hidden',
  },
  arc: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  iconCenter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 8, maxWidth: '80%' },
  progressContainer: { width: '100%', marginTop: 32 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 10 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 24 },
  stat: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 16, borderRadius: 16, borderWidth: 1 },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 13, marginTop: 2 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginTop: 20, width: '100%' },
  errorText: { fontSize: 13, marginLeft: 8, flex: 1 },
  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 24 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
