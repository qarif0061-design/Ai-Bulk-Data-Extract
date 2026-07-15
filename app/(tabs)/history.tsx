import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FadeInView, ScaleTouchableOpacity } from '../../src/shared/components/animated';
import { EmptyState } from '../../src/shared/components/empty-state';
import { AppButton } from '../../src/shared/components/app-button';
import { useHistoryStore } from '../../src/features/history/history-store';
import { JobModel, JobStatus } from '../../src/shared/models/job-model';
import { getExtractionModeInfo } from '../../src/core/enums/extraction-mode';
import { useThemeStore } from '../../src/shared/hooks/use-theme';
import { formatDistanceToNow } from 'date-fns';

export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { jobs, fetchJobs, deleteJob, searchQuery, setSearchQuery, getFilteredJobs } = useHistoryStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchJobs(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const handleDeleteJob = (job: JobModel) => {
    Alert.alert('Delete Job', `Delete "${job.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteJob(job.id) },
    ]);
  };

  const filteredJobs = getFilteredJobs();

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.COMPLETED: return colors.success;
      case JobStatus.PROCESSING: return colors.warning;
      case JobStatus.FAILED: return colors.error;
      default: return colors.textTertiary;
    }
  };

  const getStatusBg = (status: JobStatus) => {
    switch (status) {
      case JobStatus.COMPLETED: return colors.successLight;
      case JobStatus.PROCESSING: return colors.warningLight;
      case JobStatus.FAILED: return colors.errorLight;
      default: return colors.surfaceVariant;
    }
  };

  const renderJob = ({ item, index }: { item: JobModel; index: number }) => {
    const modeInfo = getExtractionModeInfo(item.extractionMode);
    return (
      <FadeInView delay={index * 60}>
        <ScaleTouchableOpacity onPress={() => router.push(`/results/${item.id}`)} onLongPress={() => handleDeleteJob(item)}>
          <View style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.jobHeader}>
              <View style={[styles.jobIconContainer, { backgroundColor: colors.primaryLight }]}>
                <MaterialCommunityIcons name={modeInfo.icon as any} size={20} color={colors.primary} />
              </View>
              <View style={styles.jobInfo}>
                <Text style={[styles.jobTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.jobMode, { color: colors.textSecondary }]}>{modeInfo.label}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>
            <View style={[styles.jobMeta, { borderTopColor: colors.borderLight }]}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="file-document-outline" size={13} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {item.fileCount} file{item.fileCount > 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={13} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                </Text>
              </View>
              {item.resultCount > 0 && (
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="database-outline" size={13} color={colors.textTertiary} />
                  <Text style={[styles.metaText, { color: colors.textTertiary }]}>{item.resultCount} results</Text>
                </View>
              )}
            </View>
            {item.errorMessage && (
              <Text style={[styles.errorMessage, { color: colors.error }]} numberOfLines={2}>{item.errorMessage}</Text>
            )}
          </View>
        </ScaleTouchableOpacity>
      </FadeInView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <FadeInView delay={0}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Job History</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{jobs.length} total jobs</Text>
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search jobs..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </FadeInView>

      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="history"
            title="No jobs yet"
            description="Your extraction history will appear here"
            action={<AppButton title="Start Extracting" onPress={() => router.push('/(tabs)/upload')} size="small" />}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14,
    marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, height: 46,
  },
  searchInput: { flex: 1, fontSize: 15, marginLeft: 8 },
  listContent: { padding: 16, paddingTop: 0 },
  jobCard: { borderWidth: 1, borderRadius: 16, padding: 14 },
  jobHeader: { flexDirection: 'row', alignItems: 'center' },
  jobIconContainer: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  jobInfo: { flex: 1, marginLeft: 10 },
  jobTitle: { fontSize: 15, fontWeight: '700' },
  jobMode: { fontSize: 12, marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  jobMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  errorMessage: { fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  separator: { height: 10 },
});
