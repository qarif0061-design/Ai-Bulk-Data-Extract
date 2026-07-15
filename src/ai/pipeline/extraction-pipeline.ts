import { ExtractionMode } from '../../core/enums/extraction-mode';
import { AiProvider } from '../abstraction/ai-provider';
import { AiResponseImpl } from '../abstraction/ai-response';
import { PromptBuilder } from '../prompts/prompt-builder';
import { OcrProcessor, ProcessedFile } from './ocr-processor';
import { ResultMerger, MergedResult } from './result-merger';

export interface ExtractionProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile: string;
  status: 'processing' | 'merging' | 'completed' | 'failed';
  error?: string;
}

export type ProgressCallback = (progress: ExtractionProgress) => void;

export class ExtractionPipeline {
  private provider: AiProvider;
  private mode: ExtractionMode;
  private customPrompt?: string;
  private onProgress?: ProgressCallback;

  constructor(
    provider: AiProvider,
    mode: ExtractionMode,
    customPrompt?: string,
    onProgress?: ProgressCallback
  ) {
    this.provider = provider;
    this.mode = mode;
    this.customPrompt = customPrompt;
    this.onProgress = onProgress;
  }

  async processFiles(files: { uri: string; name: string }[]): Promise<MergedResult> {
    const responses: { fileName: string; response: any }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      this.reportProgress({
        totalFiles: files.length,
        processedFiles: i,
        currentFile: file.name,
        status: 'processing',
      });

      try {
        const processed = await OcrProcessor.processFile(file.uri, file.name);
        const response = await this.processFile(processed);
        responses.push({ fileName: file.name, response });
      } catch (error: any) {
        responses.push({
          fileName: file.name,
          response: AiResponseImpl.failure(error.message, this.provider.name),
        });
      }
    }

    this.reportProgress({
      totalFiles: files.length,
      processedFiles: files.length,
      currentFile: '',
      status: 'merging',
    });

    const merged = ResultMerger.merge(responses);

    this.reportProgress({
      totalFiles: files.length,
      processedFiles: files.length,
      currentFile: '',
      status: 'completed',
    });

    return merged;
  }

  private async processFile(processed: ProcessedFile): Promise<AiResponseImpl> {
    const content = PromptBuilder.buildFileContent(processed.fileUri, processed.content, processed.fileName);
    const truncatedContent = PromptBuilder.truncateContent(content);
    const prompt = PromptBuilder.build(this.mode, truncatedContent, this.customPrompt);

    const response = await this.provider.sendRequest({
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
    });

    if (response.success && response.content) {
      return AiResponseImpl.success(response.content, response.tokensUsed, response.model);
    }

    return AiResponseImpl.failure(response.error || 'Failed to get AI response', response.model);
  }

  private reportProgress(progress: ExtractionProgress): void {
    this.onProgress?.(progress);
  }
}
