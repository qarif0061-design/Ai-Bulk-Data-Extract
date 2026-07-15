import { create } from 'zustand';
import { ExtractionMode } from '../../core/enums/extraction-mode';
import { ExtractionPipeline, ExtractionProgress } from '../../ai/pipeline/extraction-pipeline';
import { AiProviderFactory } from '../../ai/abstraction/ai-provider-factory';
import { FirestoreService } from '../../shared/services/firestore-service';
import { JobModel, JobStatus } from '../../shared/models/job-model';
import { useAuthStore } from '../../shared/hooks/use-auth';

interface ExtractionState {
  isProcessing: boolean;
  progress: ExtractionProgress | null;
  currentJobId: string | null;
  result: any;
  error: string | null;
  lastJobId: string | null;
  startExtraction: (
    files: { uri: string; name: string }[],
    modes: ExtractionMode[],
    jobTitle: string,
    customPrompt?: string
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

  startExtraction: async (files, modes, jobTitle, customPrompt) => {
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
          extractionMode: modes[0],
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

      const provider = AiProviderFactory.createGeminiProvider();

      let mergedResult: any = { data: {}, totalTokensUsed: 0, errors: [] };

      for (const mode of modes) {
        set({
          progress: {
            totalFiles: files.length * modes.length,
            processedFiles: 0,
            currentFile: '',
            status: 'processing',
          },
        });

        const pipeline = new ExtractionPipeline(
          provider,
          mode,
          mode === ExtractionMode.CUSTOM ? customPrompt : undefined,
          (progress) => {
            const modeIndex = modes.indexOf(mode);
            set({
              progress: {
                ...progress,
                totalFiles: files.length * modes.length,
                processedFiles: modeIndex * files.length + progress.processedFiles,
              },
            });
          }
        );

        const modeResult = await pipeline.processFiles(files);

        for (const [key, value] of Object.entries(modeResult.data)) {
          if (!mergedResult.data[key]) {
            mergedResult.data[key] = value;
          } else if (Array.isArray(mergedResult.data[key]) && Array.isArray(value)) {
            mergedResult.data[key] = [...mergedResult.data[key], ...value];
          }
        }
        mergedResult.totalTokensUsed += modeResult.totalTokensUsed;
        mergedResult.errors.push(...modeResult.errors);
      }

      if (isAuthenticated) {
        const totalCredits = files.length * modes.length;
        await FirestoreService.saveExtractedData(
          jobId,
          user!.uid,
          mergedResult.data,
          'merged',
          0,
          mergedResult.totalTokensUsed,
          JSON.stringify(mergedResult.data)
        );

        await FirestoreService.updateJob(jobId, {
          status: mergedResult.errors.length > 0 ? JobStatus.FAILED : JobStatus.COMPLETED,
          resultCount: Object.values(mergedResult.data).reduce((acc: number, val) => {
            return acc + (Array.isArray(val) ? val.length : 0);
          }, 0),
          totalCreditsUsed: totalCredits,
          completedAt: new Date(),
          errorMessage: mergedResult.errors.length > 0 ? mergedResult.errors.join('\n') : undefined,
        });

        await FirestoreService.useCredits(user!.uid, totalCredits);
        await authState.refreshUserModel();
      }

      set({
        isProcessing: false,
        result: mergedResult.data,
        lastJobId: jobId,
        progress: {
          totalFiles: files.length * modes.length,
          processedFiles: files.length * modes.length,
          currentFile: '',
          status: mergedResult.errors.length > 0 ? 'failed' : 'completed',
          error: mergedResult.errors.length > 0 ? mergedResult.errors.join('\n') : undefined,
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
