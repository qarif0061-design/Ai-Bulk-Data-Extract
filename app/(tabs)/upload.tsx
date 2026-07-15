import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppButton } from '../../src/shared/components/app-button';
import { AppCard } from '../../src/shared/components/app-card';
import { LoadingOverlay } from '../../src/shared/components/loading-overlay';
import { FadeInView, ScaleTouchableOpacity } from '../../src/shared/components/animated';
import { FeedbackModal } from '../../src/shared/components/feedback-modal';
import { useUploadStore } from '../../src/features/upload/upload-store';
import { useExtractionStore } from '../../src/features/extraction/extraction-store';
import { ExtractionMode, EXTRACTION_MODES } from '../../src/core/enums/extraction-mode';
import { formatFileSize, getFileExtension } from '../../src/core/utils/file-utils';
import { useThemeStore } from '../../src/shared/hooks/use-theme';
import { useRouter as useExpoRouter } from 'expo-router';

function isImageFile(name: string): boolean {
  const ext = getFileExtension(name);
  return ['.png', '.jpg', '.jpeg', '.webp', '.tiff', '.tif'].includes(ext);
}

function FilePreviewCard({ file, colors }: { file: { id: string; name: string; uri: string; size: number }; colors: any }) {
  return (
    <View style={[previewStyles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      {isImageFile(file.name) ? (
        <Image source={{ uri: file.uri }} style={previewStyles.image} resizeMode="cover" />
      ) : (
        <View style={[previewStyles.pdf, { backgroundColor: colors.errorLight }]}>
          <MaterialCommunityIcons name="file-pdf-box" size={32} color={colors.error} />
          <Text style={[previewStyles.pdfLabel, { color: colors.error }]}>PDF</Text>
        </View>
      )}
      <View style={previewStyles.info}>
        <Text style={[previewStyles.name, { color: colors.textPrimary }]} numberOfLines={1}>{file.name}</Text>
        <Text style={[previewStyles.size, { color: colors.textTertiary }]}>{formatFileSize(file.size)}</Text>
      </View>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  card: {
    width: 110,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  image: { width: 110, height: 90 },
  pdf: { width: 110, height: 90, alignItems: 'center', justifyContent: 'center' },
  pdfLabel: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  info: { padding: 8 },
  name: { fontSize: 11, fontWeight: '600' },
  size: { fontSize: 10, marginTop: 1 },
});

export default function UploadScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { files, addFiles, removeFile, clearFiles } = useUploadStore();
  const { isProcessing, startExtraction, error, result } = useExtractionStore();
  const [selectedMode, setSelectedMode] = useState<ExtractionMode | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastJobId, setLastJobId] = useState<string | null>(null);

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const handleExtract = async () => {
    if (files.length === 0) {
      Alert.alert('No Files', 'Please add files to extract data from.');
      return;
    }
    if (!selectedMode) {
      Alert.alert('Select Mode', 'Please select an extraction mode.');
      return;
    }
    if (selectedMode === ExtractionMode.CUSTOM && !customPrompt.trim()) {
      Alert.alert('Custom Prompt', 'Please enter a custom extraction prompt.');
      return;
    }

    try {
      const title = jobTitle.trim() || `${selectedMode} extraction - ${new Date().toLocaleDateString()}`;
      const jobId = await startExtraction(
        files.map((f) => ({ uri: f.uri, name: f.name })),
        selectedMode,
        title,
        selectedMode === ExtractionMode.CUSTOM ? customPrompt : undefined
      );
      clearFiles();
      setSelectedMode(null);
      setJobTitle('');
      setCustomPrompt('');
      setLastJobId(jobId);
      setShowFeedback(true);
    } catch (err: any) {
      Alert.alert('Extraction Failed', err.message || 'Please try again.');
    }
  };

  const handleFeedbackClose = () => {
    setShowFeedback(false);
    if (lastJobId) {
      router.push(`/results/${lastJobId}`);
    }
  };

  const selectedModeInfo = EXTRACTION_MODES.find((m) => m.mode === selectedMode);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <FadeInView delay={0}>
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              <Text style={styles.headerTitle}>AI Bulk Extractor</Text>
              <Text style={styles.headerSubtitle}>Upload files and extract structured data instantly</Text>
            </LinearGradient>
          </FadeInView>

          <FadeInView delay={100}>
            <ScaleTouchableOpacity onPress={addFiles} style={[styles.uploadArea, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
              <View style={[styles.uploadIconContainer, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons name="cloud-upload-outline" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.uploadTitle, { color: colors.textPrimary }]}>Tap to add files</Text>
              <Text style={[styles.uploadSubtitle, { color: colors.textSecondary }]}>
                PDF, PNG, JPEG, WEBP, TIFF{'\n'}Max 10 files, 20MB each
              </Text>
            </ScaleTouchableOpacity>
          </FadeInView>

          {files.length > 0 && (
            <FadeInView delay={200}>
              <AppCard style={[styles.fileListCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <View style={styles.fileListHeader}>
                  <Text style={[styles.fileListTitle, { color: colors.textPrimary }]}>
                    {files.length} file{files.length > 1 ? 's' : ''} ({formatFileSize(totalSize)})
                  </Text>
                  <TouchableOpacity onPress={clearFiles}>
                    <Text style={[styles.clearAll, { color: colors.error }]}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
                  {files.map((file) => (
                    <View key={file.id} style={styles.previewWrapper}>
                      <FilePreviewCard file={file} colors={colors} />
                      <TouchableOpacity onPress={() => removeFile(file.id)} style={[styles.removeBtn, { backgroundColor: colors.surface }]}>
                        <MaterialCommunityIcons name="close-circle" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </AppCard>
            </FadeInView>
          )}

          <FadeInView delay={300}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Job Title (optional)</Text>
            <TextInput
              style={[styles.titleInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }]}
              placeholder="e.g., Invoice Data Q1"
              placeholderTextColor={colors.textTertiary}
              value={jobTitle}
              onChangeText={setJobTitle}
            />
          </FadeInView>

          <FadeInView delay={350}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Extraction Mode</Text>
            <View style={styles.modeGrid}>
              {EXTRACTION_MODES.map((modeInfo) => (
                <ScaleTouchableOpacity
                  key={modeInfo.mode}
                  onPress={() => setSelectedMode(modeInfo.mode)}
                  style={[
                    styles.modeCard,
                    {
                      backgroundColor: selectedMode === modeInfo.mode ? colors.primaryLight : colors.surface,
                      borderColor: selectedMode === modeInfo.mode ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={modeInfo.icon as any}
                    size={22}
                    color={selectedMode === modeInfo.mode ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[
                    styles.modeLabel,
                    { color: selectedMode === modeInfo.mode ? colors.primary : colors.textSecondary },
                  ]}>
                    {modeInfo.label}
                  </Text>
                </ScaleTouchableOpacity>
              ))}
            </View>
          </FadeInView>

          {selectedMode === ExtractionMode.CUSTOM && (
            <FadeInView delay={0}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Custom Prompt</Text>
              <TextInput
                style={[styles.customPromptInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }]}
                placeholder="Describe what data you want to extract..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={customPrompt}
                onChangeText={setCustomPrompt}
              />
            </FadeInView>
          )}

          {selectedModeInfo && files.length > 0 && (
            <FadeInView delay={0}>
              <AppCard style={[styles.modeInfoCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <View style={styles.modeInfoRow}>
                  <MaterialCommunityIcons name={selectedModeInfo.icon as any} size={24} color={colors.primary} />
                  <View style={styles.modeInfoText}>
                    <Text style={[styles.modeInfoLabel, { color: colors.textPrimary }]}>{selectedModeInfo.label}</Text>
                    <Text style={[styles.modeInfoDesc, { color: colors.textSecondary }]}>{selectedModeInfo.description}</Text>
                  </View>
                </View>
                <Text style={[styles.costInfo, { color: colors.textSecondary, borderTopColor: colors.borderLight }]}>
                  Processing {files.length} file{files.length > 1 ? 's' : ''}
                </Text>
              </AppCard>
            </FadeInView>
          )}

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
          <AppButton
            title={`Extract Data${files.length > 0 && selectedMode ? ` (${files.length})` : ''}`}
            onPress={handleExtract}
            disabled={files.length === 0 || !selectedMode}
            loading={isProcessing}
            fullWidth
          />
        </View>

        <LoadingOverlay visible={isProcessing} message="Processing extraction..." />
        <FeedbackModal visible={showFeedback} onClose={handleFeedbackClose} onSubmit={() => handleFeedbackClose()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 100 },
  headerGradient: { borderRadius: 20, padding: 24, marginBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 20 },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadIconContainer: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  uploadTitle: { fontSize: 16, fontWeight: '700' },
  uploadSubtitle: { fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 18 },
  fileListCard: { padding: 16, marginBottom: 20 },
  fileListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  fileListTitle: { fontSize: 14, fontWeight: '700' },
  clearAll: { fontSize: 13, fontWeight: '600' },
  previewScroll: { marginHorizontal: -4 },
  previewWrapper: { position: 'relative', marginRight: 10 },
  removeBtn: { position: 'absolute', top: -6, right: -6, borderRadius: 11 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  titleInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    marginBottom: 20,
  },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  modeCard: {
    width: '31%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
  },
  modeLabel: { fontSize: 11, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  customPromptInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modeInfoCard: { padding: 16, marginBottom: 16 },
  modeInfoRow: { flexDirection: 'row', alignItems: 'center' },
  modeInfoText: { marginLeft: 12, flex: 1 },
  modeInfoLabel: { fontSize: 15, fontWeight: '700' },
  modeInfoDesc: { fontSize: 13, marginTop: 2 },
  costInfo: { fontSize: 13, marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { fontSize: 13, marginLeft: 8, flex: 1 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, borderTopWidth: 1,
  },
});
