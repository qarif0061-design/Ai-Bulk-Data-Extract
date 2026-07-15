import { ExtractionMode } from '../../core/enums/extraction-mode';
import { EXTRACTION_PROMPTS, ExtractionPrompt } from './extraction-prompts';

export class PromptBuilder {
  static build(mode: ExtractionMode, content: string, customPrompt?: string): ExtractionPrompt {
    const promptFn = EXTRACTION_PROMPTS[mode];
    if (!promptFn) {
      throw new Error(`Unsupported extraction mode: ${mode}`);
    }
    return promptFn(content, customPrompt);
  }

  static buildFileContent(fileUri: string, fileContent: string, fileName: string): string {
    return `File: ${fileName}\n---\n${fileContent}`;
  }

  static truncateContent(content: string, maxLength: number = 100000): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '\n... [Content truncated]';
  }
}
