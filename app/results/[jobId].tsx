import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppCard } from '../../src/shared/components/app-card';
import { AppButton } from '../../src/shared/components/app-button';
import { EmptyState } from '../../src/shared/components/empty-state';
import { LoadingOverlay } from '../../src/shared/components/loading-overlay';
import { FadeInView, ScaleTouchableOpacity } from '../../src/shared/components/animated';
import { FeedbackModal } from '../../src/shared/components/feedback-modal';
import { FirestoreService } from '../../src/shared/services/firestore-service';
import { useAuthStore } from '../../src/shared/hooks/use-auth';
import { useExtractionStore } from '../../src/features/extraction/extraction-store';
import { useThemeStore } from '../../src/shared/hooks/use-theme';
import { useFeedbackStore } from '../../src/shared/hooks/use-feedback';
import { JobModel, JobStatus } from '../../src/shared/models/job-model';
import { ExportFormat, EXPORT_FORMAT_INFO } from '../../src/core/enums/export-format';
import { ResultMerger } from '../../src/ai/pipeline/result-merger';

let Clipboard: any = null;
if (Platform.OS !== 'web') {
  try { Clipboard = require('expo-clipboard'); } catch {}
}

export default function ResultsScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const extractionResult = useExtractionStore((s) => s.result);
  const { hasRated, loadRating, markRated } = useFeedbackStore();
  const [job, setJob] = useState<JobModel | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'data' | 'raw'>('data');
  const [showFeedback, setShowFeedback] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadResults(); loadRating(); }, [jobId]);

  const loadResults = async () => {
    if (!jobId) return;
    try {
      setIsLoading(true);
      if (user) {
        try {
          const [jobData, dataItems] = await Promise.all([FirestoreService.getJob(jobId), FirestoreService.getExtractedData(jobId)]);
          setJob(jobData);
          if (dataItems.length > 0 && dataItems[0].data) setExtractedData(dataItems[0].data);
          setIsLoading(false);
          return;
        } catch (e) { /* fall through */ }
      }
      if (extractionResult) {
        setExtractedData(extractionResult);
        setJob({ id: jobId, userId: user?.uid || 'guest', title: 'Extraction Result', status: JobStatus.COMPLETED, extractionMode: 'unknown' as any, files: [], fileCount: 0, createdAt: new Date(), updatedAt: new Date(), resultCount: 0, totalCreditsUsed: 0 });
      }
    } catch (error) { console.error('Failed to load results:', error); }
    finally { setIsLoading(false); }
  };

  const getTableData = (): { headers: string[]; rows: any[][] } => {
    if (!extractedData) return { headers: [], rows: [] };
    const flatData = ResultMerger.flattenForExport(extractedData);
    if (flatData.length === 0) return { headers: [], rows: [] };
    const headers = [...new Set(flatData.flatMap((item) => Object.keys(item)))];
    const rows = flatData.map((item) => headers.map((h) => item[h] ?? ''));
    return { headers, rows };
  };

  const triggerFeedbackIfAllowed = useCallback(() => {
    if (!hasRated) {
      setShowFeedback(true);
    }
  }, [hasRated]);

  const handleCopyText = useCallback(async () => {
    if (!extractedData) return;
    const text = JSON.stringify(extractedData, null, 2);
    try {
      if (Clipboard) {
        await Clipboard.setStringAsync(text);
      } else if (navigator?.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        Alert.alert('Copy', 'Clipboard not available on this platform');
        return;
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      triggerFeedbackIfAllowed();
    } catch (error: any) {
      Alert.alert('Copy Failed', error.message || 'Could not copy to clipboard');
    }
  }, [extractedData, hasRated, triggerFeedbackIfAllowed]);

  const handleExport = async (fmt: ExportFormat) => {
    if (!extractedData || !job) return;
    try {
      const flatData = ResultMerger.flattenForExport(extractedData);
      let content = '';
      let fileName = `${job.title.replace(/\s+/g, '_')}_export`;
      let mimeType = 'text/plain';

      switch (fmt) {
        case ExportFormat.JSON:
          content = JSON.stringify(extractedData, null, 2);
          fileName += '.json'; mimeType = 'application/json'; break;
        case ExportFormat.CSV:
        case ExportFormat.EXCEL:
          if (flatData.length > 0) {
            const headers = Object.keys(flatData[0]);
            const csvRows = [headers.join(','), ...flatData.map((row) => headers.map((h) => { const val = String(row[h] ?? ''); return val.includes(',') ? `"${val}"` : val; }).join(','))];
            content = csvRows.join('\n');
          }
          fileName += '.csv'; mimeType = 'text/csv'; break;
      }

      if (Platform.OS === 'web') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const FileSystem = require('expo-file-system');
        const Sharing = require('expo-sharing');
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: `Export as ${EXPORT_FORMAT_INFO[fmt].label}` });
        } else { Alert.alert('Export', `File saved to: ${fileUri}`); }
      }

      triggerFeedbackIfAllowed();
    } catch (error: any) { Alert.alert('Export Failed', error.message || 'Could not export data'); }
  };

  const handleFeedbackClose = () => {
    setShowFeedback(false);
  };

  const handleFeedbackSubmit = async () => {
    await markRated();
    setShowFeedback(false);
  };

  const { headers, rows } = getTableData();

  if (isLoading) return <View style={[styles.centered, { backgroundColor: colors.background }]}><LoadingOverlay visible={true} message="Loading results..." /></View>;
  if (!extractedData) return (
    <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]} edges={['top']}>
      <EmptyState icon="file-document-remove" title="No results" description="No extraction data available."
        action={<AppButton title="Go Back" onPress={() => router.back()} size="small" />} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FadeInView delay={0}>
          <AppCard style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.jobHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.jobTitle, { color: colors.textPrimary }]}>{job?.title || 'Extraction Result'}</Text>
                {job && <Text style={[styles.jobMeta, { color: colors.textSecondary }]}>{job.extractionMode}</Text>}
              </View>
              <View style={[styles.badge, { backgroundColor: colors.successLight }]}>
                <View style={[styles.badgeDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.badgeText, { color: colors.success }]}>completed</Text>
              </View>
            </View>
          </AppCard>
        </FadeInView>

        <FadeInView delay={100}>
          <View style={[styles.tabBar, { backgroundColor: colors.surfaceVariant }]}>
            <ScaleTouchableOpacity onPress={() => setActiveTab('data')} style={[styles.tab, activeTab === 'data' && { backgroundColor: colors.surface }]}>
              <Text style={[styles.tabText, { color: activeTab === 'data' ? colors.primary : colors.textSecondary }]}>Structured Data</Text>
            </ScaleTouchableOpacity>
            <ScaleTouchableOpacity onPress={() => setActiveTab('raw')} style={[styles.tab, activeTab === 'raw' && { backgroundColor: colors.surface }]}>
              <Text style={[styles.tabText, { color: activeTab === 'raw' ? colors.primary : colors.textSecondary }]}>Raw JSON</Text>
            </ScaleTouchableOpacity>
          </View>
        </FadeInView>

        <FadeInView delay={200}>
          {activeTab === 'data' && (
            <AppCard style={[styles.dataCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              {rows.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View>
                    <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                      {headers.map((header, idx) => (
                        <View key={idx} style={[styles.tableCell, { backgroundColor: colors.surfaceVariant, borderRadius: 6 }]}>
                          <Text style={[styles.tableHeaderText, { color: colors.textPrimary }]} numberOfLines={1}>{header}</Text>
                        </View>
                      ))}
                    </View>
                    {rows.map((row, rowIdx) => (
                      <View key={rowIdx} style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
                        {row.map((cell, cellIdx) => (
                          <View key={cellIdx} style={styles.tableCell}>
                            <Text style={[styles.tableCellText, { color: colors.textPrimary }]} numberOfLines={2}>{String(cell)}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.noData}><Text style={[styles.noDataText, { color: colors.textSecondary }]}>No structured data available</Text></View>
              )}
            </AppCard>
          )}
          {activeTab === 'raw' && (
            <AppCard style={[styles.rawCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <Text style={[styles.rawJson, { color: colors.textPrimary }]} selectable>{JSON.stringify(extractedData, null, 2)}</Text>
              </ScrollView>
            </AppCard>
          )}
        </FadeInView>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
        <ScaleTouchableOpacity onPress={handleCopyText} style={[styles.copyBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}>
          <MaterialCommunityIcons name={copied ? 'check' : 'content-copy'} size={18} color={colors.primary} />
          <Text style={[styles.copyBtnText, { color: colors.primary }]}>{copied ? 'Copied!' : 'Copy All'}</Text>
        </ScaleTouchableOpacity>
        <View style={styles.exportButtons}>
          {(Object.values(ExportFormat)).map((fmt) => (
            <ScaleTouchableOpacity key={fmt} onPress={() => handleExport(fmt)} style={[styles.exportBtn, { borderColor: colors.primary }]}>
              <MaterialCommunityIcons name={EXPORT_FORMAT_INFO[fmt].icon as any} size={18} color={colors.primary} />
              <Text style={[styles.exportBtnText, { color: colors.primary }]}>{fmt.toUpperCase()}</Text>
            </ScaleTouchableOpacity>
          ))}
        </View>
      </View>

      <FeedbackModal visible={showFeedback} onClose={handleFeedbackClose} onSubmit={handleFeedbackSubmit} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  jobCard: { padding: 16, marginBottom: 16 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  jobTitle: { fontSize: 18, fontWeight: '800' },
  jobMeta: { fontSize: 13, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 12 },
  badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  tabBar: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabText: { fontSize: 14, fontWeight: '700' },
  dataCard: { padding: 12, marginBottom: 16 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, paddingBottom: 8, marginBottom: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 8 },
  tableCell: { minWidth: 120, maxWidth: 200, paddingHorizontal: 8, paddingVertical: 4 },
  tableHeaderText: { fontSize: 13, fontWeight: '700' },
  tableCellText: { fontSize: 13 },
  noData: { padding: 32, alignItems: 'center' },
  noDataText: { fontSize: 14 },
  rawCard: { padding: 16, marginBottom: 16 },
  rawJson: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', lineHeight: 18 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 24, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  copyBtnText: { fontSize: 13, fontWeight: '700' },
  exportButtons: { flex: 1, flexDirection: 'row', gap: 8 },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12 },
  exportBtnText: { fontSize: 11, fontWeight: '700' },
});
