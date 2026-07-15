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
        let extractedText = '';

        try {
          extractedText = await extractTextFromFile(file.uri, file.name);
        } catch (e) {
          console.warn('Local text extraction failed for', file.name, e);
        }

        if (extractedText && extractedText.trim().length > 5) {
          const localResult = extractDataLocally(extractedText, this.mode, file.name);
          const hasData = this.checkHasData(localResult.data);
          if (hasData) {
            responses.push({
              fileName: file.name,
              response: AiResponseImpl.success(JSON.stringify(localResult.data), 0, 'local-rule-engine'),
            });
          } else {
            const aiResponse = await this.tryAiExtraction(file);
            if (aiResponse) {
              responses.push({ fileName: file.name, response: aiResponse });
            } else {
              responses.push({
                fileName: file.name,
                response: AiResponseImpl.success(
                  JSON.stringify({ raw: extractedText, note: 'Text extracted but no structured data found for this mode' }),
                  0,
                  'local-rule-engine'
                ),
              });
            }
          }
        } else {
          const aiResponse = await this.tryAiExtraction(file);
          if (aiResponse) {
            responses.push({ fileName: file.name, response: aiResponse });
          } else {
            responses.push({
              fileName: file.name,
              response: AiResponseImpl.failure(
                `No text could be extracted from "${file.name}". This may be a scanned/image PDF. Please upload a PDF with selectable text, or try a clearer image.`,
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

    const totalErrors = merged.errors.length;
    this.reportProgress({
      totalFiles: files.length,
      processedFiles: files.length,
      currentFile: '',
      status: totalErrors === files.length ? 'failed' : 'completed',
      error: totalErrors > 0 ? merged.errors.join('\n') : undefined,
    });

    return merged;
  }

  private async tryAiExtraction(file: { uri: string; name: string }): Promise<AiResponseImpl | null> {
    try {
      const processed = await OcrProcessor.processFile(file.uri, file.name);
      const prompt = PromptBuilder.build(this.mode, file.name, this.customPrompt);
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

  private checkHasData(data: any): boolean {
    if (!data) return false;
    for (const [key, value] of Object.entries(data)) {
      if (key === 'raw' || key === 'note' || key === 'allText' || key === 'documentType') continue;
      if (Array.isArray(value) && value.length > 0) return true;
      if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) return true;
      if (typeof value === 'number' && value !== 0) return true;
      if (typeof value === 'string' && value.length > 0) return true;
    }
    return false;
  }

  private reportProgress(progress: ExtractionProgress): void {
    this.onProgress?.(progress);
  }
}
