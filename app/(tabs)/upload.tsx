import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppButton } from '../../src/shared/components/app-button';
import { AppCard } from '../../src/shared/components/app-card';
import { ProcessingOverlay } from '../../src/shared/components/processing-overlay';
import { FadeInView, ScaleTouchableOpacity } from '../../src/shared/components/animated';
import { useUploadStore } from '../../src/features/upload/upload-store';
import { useExtractionStore } from '../../src/features/extraction/extraction-store';
import { ExtractionMode, EXTRACTION_MODES } from '../../src/core/enums/extraction-mode';
import { formatFileSize, getFileExtension } from '../../src/core/utils/file-utils';
import { useThemeStore } from '../../src/shared/hooks/use-theme';

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
  const { isProcessing, startExtraction, error, progress } = useExtractionStore();
  const [selectedModes, setSelectedModes] = useState<ExtractionMode[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const toggleMode = (mode: ExtractionMode) => {
    const info = EXTRACTION_MODES.find((m) => m.mode === mode);
    if (info?.standaloneOnly) {
      setSelectedModes((prev) => prev.length === 1 && prev[0] === mode ? [] : [mode]);
      return;
    }

    setSelectedModes((prev) => {
      if (prev.includes(mode)) {
        return prev.filter((m) => m !== mode);
      }

      const hasStandalone = prev.some((m) => {
        const i = EXTRACTION_MODES.find((em) => em.mode === m);
        return i?.standaloneOnly;
      });
      if (hasStandalone) return [mode];

      return [...prev, mode];
    });
  };

  const handleExtract = async () => {
    if (files.length === 0) {
      Alert.alert('No Files', 'Please add files to extract data from.');
      return;
    }
    if (selectedModes.length === 0) {
      Alert.alert('Select Mode', 'Please select at least one extraction mode.');
      return;
    }
    if (selectedModes.includes(ExtractionMode.CUSTOM) && !customPrompt.trim()) {
      Alert.alert('Custom Prompt', 'Please enter a custom extraction prompt.');
      return;
    }

    try {
      const title = jobTitle.trim() || `${selectedModes.length > 1 ? 'Multi-extract' : selectedModes[0]} - ${new Date().toLocaleDateString()}`;
      const jobId = await startExtraction(
        files.map((f) => ({ uri: f.uri, name: f.name })),
        selectedModes,
        title,
        selectedModes.includes(ExtractionMode.CUSTOM) ? customPrompt : undefined
      );
      setJobTitle('');
      setCustomPrompt('');
      router.push(`/results/${jobId}`);
    } catch (err: any) {
      Alert.alert('Extraction Failed', err.message || 'Please try again.');
    }
  };

  const modeGridItems = EXTRACTION_MODES.filter((m) => m.mode !== ExtractionMode.EXTRACT_ALL);
  const extractAllInfo = EXTRACTION_MODES.find((m) => m.mode === ExtractionMode.EXTRACT_ALL);

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
              <Text style={[styles.uploadTitle, { color: colors.textPrimary }]}>
                {files.length > 0 ? 'Add More Files' : 'Tap to add files'}
              </Text>
              <Text style={[styles.uploadSubtitle, { color: colors.textSecondary }]}>
                PDF, PNG, JPEG, WEBP, TIFF{'\n'}Pick multiple at once · Max 10 files, 20MB each
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
                  <TouchableOpacity onPress={() => Alert.alert('Clear All', 'Remove all files?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: clearFiles },
                  ])}>
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

            {extractAllInfo && (
              <ScaleTouchableOpacity
                onPress={() => toggleMode(ExtractionMode.EXTRACT_ALL)}
                style={[
                  styles.extractAllCard,
                  {
                    backgroundColor: selectedModes.includes(ExtractionMode.EXTRACT_ALL) ? colors.primary : colors.surface,
                    borderColor: selectedModes.includes(ExtractionMode.EXTRACT_ALL) ? colors.primary : colors.cardBorder,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={extractAllInfo.icon as any}
                  size={24}
                  color={selectedModes.includes(ExtractionMode.EXTRACT_ALL) ? '#FFFFFF' : colors.primary}
                />
                <View style={styles.extractAllText}>
                  <Text style={[
                    styles.extractAllLabel,
                    { color: selectedModes.includes(ExtractionMode.EXTRACT_ALL) ? '#FFFFFF' : colors.textPrimary },
                  ]}>
                    {extractAllInfo.label}
                  </Text>
                  <Text style={[
                    styles.extractAllDesc,
                    { color: selectedModes.includes(ExtractionMode.EXTRACT_ALL) ? 'rgba(255,255,255,0.85)' : colors.textSecondary },
                  ]}>
                    {extractAllInfo.description}
                  </Text>
                </View>
                {selectedModes.includes(ExtractionMode.EXTRACT_ALL) && (
                  <MaterialCommunityIcons name="check-circle" size={22} color="#FFFFFF" />
                )}
              </ScaleTouchableOpacity>
            )}

            <Text style={[styles.multiHint, { color: colors.textTertiary }]}>
              Or select multiple specific modes below (tap to toggle):
            </Text>

            <View style={styles.modeGrid}>
              {modeGridItems.map((modeInfo) => {
                const isSelected = selectedModes.includes(modeInfo.mode);
                const isDisabled = !isSelected && selectedModes.includes(ExtractionMode.EXTRACT_ALL);
                return (
                  <ScaleTouchableOpacity
                    key={modeInfo.mode}
                    onPress={() => toggleMode(modeInfo.mode)}
                    disabled={isDisabled}
                    style={[
                      styles.modeCard,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.cardBorder,
                        opacity: isDisabled ? 0.4 : 1,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={modeInfo.icon as any}
                      size={22}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[
                      styles.modeLabel,
                      { color: isSelected ? colors.primary : colors.textSecondary },
                    ]}>
                      {modeInfo.label}
                    </Text>
                    {isSelected && (
                      <View style={[styles.modeCheck, { backgroundColor: colors.primary }]}>
                        <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </ScaleTouchableOpacity>
                );
              })}
            </View>
          </FadeInView>

          {selectedModes.includes(ExtractionMode.CUSTOM) && (
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

          {selectedModes.length > 0 && files.length > 0 && (
            <FadeInView delay={0}>
              <AppCard style={[styles.modeInfoCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <View style={styles.selectedModesRow}>
                  <MaterialCommunityIcons name="check-multiple" size={20} color={colors.primary} />
                  <Text style={[styles.selectedModesText, { color: colors.textPrimary }]}>
                    {selectedModes.length} mode{selectedModes.length > 1 ? 's' : ''} selected
                  </Text>
                </View>
                <View style={styles.selectedModesTags}>
                  {selectedModes.map((m) => {
                    const info = EXTRACTION_MODES.find((em) => em.mode === m);
                    return (
                      <View key={m} style={[styles.modeTag, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                        <Text style={[styles.modeTagText, { color: colors.primary }]}>{info?.label}</Text>
                      </View>
                    );
                  })}
                </View>
                <Text style={[styles.costInfo, { color: colors.textSecondary, borderTopColor: colors.borderLight }]}>
                  Processing {files.length} file{files.length > 1 ? 's' : ''} × {selectedModes.length} mode{selectedModes.length > 1 ? 's' : ''}
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
            title={`Extract Data${files.length > 0 && selectedModes.length > 0 ? ` (${files.length}×${selectedModes.length})` : ''}`}
            onPress={handleExtract}
            disabled={files.length === 0 || selectedModes.length === 0}
            loading={isProcessing}
            fullWidth
          />
        </View>

        <ProcessingOverlay
          visible={isProcessing}
          message={progress?.status === 'merging' ? 'Merging results...' : progress?.status === 'completed' ? 'Done!' : 'Extracting data...'}
          currentFile={progress?.currentFile || ''}
          processedFiles={progress?.processedFiles || 0}
          totalFiles={progress?.totalFiles || 0}
          status={progress?.status || 'processing'}
        />
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
  extractAllCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  extractAllText: { flex: 1, marginLeft: 12 },
  extractAllLabel: { fontSize: 16, fontWeight: '700' },
  extractAllDesc: { fontSize: 12, marginTop: 2 },
  multiHint: { fontSize: 12, marginBottom: 10, fontStyle: 'italic' },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  modeCard: {
    width: '31%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    position: 'relative',
  },
  modeLabel: { fontSize: 11, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  modeCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  selectedModesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  selectedModesText: { fontSize: 14, fontWeight: '700' },
  selectedModesTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  modeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  modeTagText: { fontSize: 12, fontWeight: '600' },
  costInfo: { fontSize: 13, marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { fontSize: 13, marginLeft: 8, flex: 1 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, borderTopWidth: 1,
  },
});
