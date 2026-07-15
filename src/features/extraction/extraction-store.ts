import { create } from 'zustand';
import { ExtractionMode } from '../../core/enums/extraction-mode';
import { ExtractionPipeline, ExtractionProgress } from '../../ai/pipeline/extraction-pipeline';
import { AiProviderFactory } from '../../ai/abstraction/ai-provider-factory';
import { FirestoreService } from '../../shared/services/firestore-service';
import { JobModel, JobStatus } from '../../shared/models/job-model';
import { useAuthStore } from '../../shared/hooks/use-auth';
import { AI_CONFIG } from '../../core/config/app-config';

interface ExtractionState {
  isProcessing: boolean;
  progress: ExtractionProgress | null;
  currentJobId: string | null;
  result: any;
  error: string | null;
  lastJobId: string | null;
  startExtraction: (
    files: { uri: string; name: string }[],
    mode: ExtractionMode,
    jobTitle: string,
    customPrompt?: string,
    apiKey?: string
  ) => Promise<string>;
  reset: () => void;
  setError: (error: string | null) => void;
}

export const useExtractionStore = create<ExtractionState>((set, get) => ({
  isProcessing: false,
  progress: null,
  currentJobId: null,
  result: null,
  error: null,
  lastJobId: null,

  startExtraction: async (files, mode, jobTitle, customPrompt, apiKey) => {
    try {
      set({ isProcessing: true, error: null, progress: null });

      const authState = useAuthStore.getState();
      const user = authState.user;
      const isAuthenticated = !!user;

      let jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      if (isAuthenticated) {
        const job: JobModel = {
          id: jobId,
          userId: user!.uid,
          title: jobTitle,
          status: JobStatus.PROCESSING,
          extractionMode: mode,
          files: files.map((f) => ({ name: f.name, uri: f.uri })),
          fileCount: files.length,
          createdAt: new Date(),
          updatedAt: new Date(),
          resultCount: 0,
          totalCreditsUsed: 0,
          customPrompt,
        };
        await FirestoreService.createJob(job);
      }

      set({ currentJobId: jobId });

      const provider = AiProviderFactory.createOpenRouterProvider({
        apiKey: apiKey || '',
        model: AI_CONFIG.defaultModel,
        maxTokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
      });

      const pipeline = new ExtractionPipeline(
        provider,
        mode,
        customPrompt,
        (progress) => set({ progress })
      );

      const result = await pipeline.processFiles(files);

      if (isAuthenticated) {
        const totalCredits = files.length;
        await FirestoreService.saveExtractedData(
          jobId,
          user!.uid,
          result.data,
          'merged',
          0,
          result.totalTokensUsed,
          JSON.stringify(result.data)
        );

        await FirestoreService.updateJob(jobId, {
          status: result.errors.length === files.length ? JobStatus.FAILED : JobStatus.COMPLETED,
          resultCount: Object.values(result.data).reduce((acc: number, val) => {
            return acc + (Array.isArray(val) ? val.length : 0);
          }, 0),
          totalCreditsUsed: totalCredits,
          completedAt: new Date(),
          errorMessage: result.errors.length > 0 ? result.errors.join('\n') : undefined,
        });

        await FirestoreService.useCredits(user!.uid, totalCredits);
        await authState.refreshUserModel();
      }

      set({
        isProcessing: false,
        result: result.data,
        lastJobId: jobId,
        progress: {
          totalFiles: files.length,
          processedFiles: files.length,
          currentFile: '',
          status: 'completed',
        },
      });

      return jobId;
    } catch (error: any) {
      set({
        isProcessing: false,
        error: error.message || 'Extraction failed',
        progress: {
          totalFiles: 0,
          processedFiles: 0,
          currentFile: '',
          status: 'failed',
          error: error.message,
        },
      });
      throw error;
    }
  },

  reset: () =>
    set({
      isProcessing: false,
      progress: null,
      currentJobId: null,
      result: null,
      error: null,
    }),

  setError: (error) => set({ error }),
}));
