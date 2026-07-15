import { ExtractionMode } from '../../core/enums/extraction-mode';
import { AiProvider } from '../abstraction/ai-provider';
import { AiResponseImpl } from '../abstraction/ai-response';
import { PromptBuilder } from '../prompts/prompt-builder';
import { OcrProcessor, ProcessedFile } from './ocr-processor';
import { extractTextFromFile } from './local-text-extractor';
import { extractDataLocally } from './rule-extractor';
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
  private provider: AiProvider | null;
  private mode: ExtractionMode;
  private customPrompt?: string;
  private onProgress?: ProgressCallback;

  constructor(
    provider: AiProvider | null,
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
        const extractedText = await extractTextFromFile(file.uri, file.name);

        if (extractedText && extractedText.trim().length > 10) {
          const localResult = extractDataLocally(extractedText, this.mode, file.name);
          responses.push({
            fileName: file.name,
            response: AiResponseImpl.success(JSON.stringify(localResult.data), 0, 'local-rule-engine'),
          });
        } else {
          const processed = await OcrProcessor.processFile(file.uri, file.name);
          const aiResponse = await this.tryAiExtraction(processed);
          if (aiResponse) {
            responses.push({ fileName: file.name, response: aiResponse });
          } else {
            responses.push({
              fileName: file.name,
              response: AiResponseImpl.failure(
                'Could not extract text from this file. For images, try providing a clearer image or use PDF with selectable text.',
                'local'
              ),
            });
          }
        }
      } catch (error: any) {
        responses.push({
          fileName: file.name,
          response: AiResponseImpl.failure(error.message || 'Extraction failed', 'local'),
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

  private async tryAiExtraction(processed: ProcessedFile): Promise<AiResponseImpl | null> {
    if (!this.provider) return null;

    try {
      const prompt = PromptBuilder.build(this.mode, processed.fileName, this.customPrompt);
      const response = await this.provider.sendRequest({
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
        imageBase64: processed.base64Data,
        imageMimeType: processed.mimeType,
      });

      if (response.success && response.content) {
        return AiResponseImpl.success(response.content, response.tokensUsed, response.model);
      }
    } catch {}
    return null;
  }

  private reportProgress(progress: ExtractionProgress): void {
    this.onProgress?.(progress);
  }
}
