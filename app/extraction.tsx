import React, { useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useExtractionStore } from '../src/features/extraction/extraction-store';
import { useThemeStore } from '../src/shared/hooks/use-theme';
import { ProgressIndicator } from '../src/shared/components/progress-indicator';
import { FadeInView } from '../src/shared/components/animated';

export default function ExtractionScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { isProcessing, progress, currentJobId, result, error } = useExtractionStore();

  useEffect(() => {
    if (!isProcessing && currentJobId) {
      if (result) router.replace(`/results/${currentJobId}`);
      else if (error) router.back();
    }
  }, [isProcessing, currentJobId, result, error]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => isProcessing);
    return () => backHandler.remove();
  }, [isProcessing]);

  const progressPercent = progress ? Math.round((progress.processedFiles / Math.max(progress.totalFiles, 1)) * 100) : 0;
  const statusColor = progress?.status === 'completed' ? colors.success : progress?.status === 'failed' ? colors.error : colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <FadeInView delay={0}>
          <View style={[styles.iconContainer, { backgroundColor: statusColor + '15' }]}>
            <MaterialCommunityIcons
              name={progress?.status === 'completed' ? 'check-circle' : progress?.status === 'failed' ? 'alert-circle' : 'loading'}
              size={56}
              color={statusColor}
            />
          </View>
        </FadeInView>

        <FadeInView delay={150}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {progress?.status === 'completed' ? 'Extraction Complete!' : progress?.status === 'failed' ? 'Extraction Failed' : progress?.status === 'merging' ? 'Merging Results...' : 'Processing Files...'}
          </Text>
        </FadeInView>

        <FadeInView delay={250}>
          {progress && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {progress.currentFile ? `Processing: ${progress.currentFile}` : `${progress.processedFiles} of ${progress.totalFiles} files`}
            </Text>
          )}
        </FadeInView>

        <FadeInView delay={350}>
          <View style={styles.progressContainer}>
            <ProgressIndicator progress={progressPercent} height={10} color={statusColor} />
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>{progressPercent}%</Text>
          </View>
        </FadeInView>

        {progress?.totalFiles && (
          <FadeInView delay={400}>
            <View style={styles.statsRow}>
              <View style={[styles.stat, { backgroundColor: colors.surface }]}>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{progress.processedFiles}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Processed</Text>
              </View>
              <View style={[styles.stat, { backgroundColor: colors.surface }]}>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{progress.totalFiles - progress.processedFiles}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Remaining</Text>
              </View>
            </View>
          </FadeInView>
        )}

        {(error || progress?.error) && (
          <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]}>
            <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error || progress?.error}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconContainer: { width: 100, height: 100, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  progressContainer: { width: '100%', marginTop: 32 },
  progressText: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 24 },
  stat: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 16, borderRadius: 16 },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 13, marginTop: 2 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginTop: 20, width: '100%' },
  errorText: { fontSize: 13, marginLeft: 8, flex: 1 },
});
