import { AiProvider, AiProviderConfig } from './ai-provider';
import { OpenRouterProvider } from '../providers/openai-provider';

export class AiProviderFactory {
  static createOpenRouterProvider(config: AiProviderConfig): AiProvider {
    return new OpenRouterProvider(config);
  }

  static createDefaultProvider(): AiProvider {
    return new OpenRouterProvider({
      apiKey: '',
      model: 'openai/gpt-4o-mini',
      maxTokens: 4096,
      temperature: 0.1,
    });
  }
}
