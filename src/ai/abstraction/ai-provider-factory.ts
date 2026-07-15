import { AiProvider } from './ai-provider';
import { GeminiProvider } from '../providers/openai-provider';

export class AiProviderFactory {
  static createGeminiProvider(): AiProvider {
    return new GeminiProvider();
  }
}
