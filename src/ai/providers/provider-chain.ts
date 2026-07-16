import { AiProvider, AiRequest, AiResponse } from '../abstraction/ai-provider';
import { GeminiProvider } from './gemini-provider';
import { GrokProvider } from './grok-provider';
import { OpenRouterProvider } from './openrouter-provider';
import { OpenAiProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';

export class ProviderChain implements AiProvider {
  name = 'chain';
  private providers: AiProvider[];
  private results: { provider: string; success: boolean; error?: string }[] = [];

  constructor() {
    this.providers = [
      new GeminiProvider(),
      new GrokProvider(),
      new OpenRouterProvider(),
      new OpenAiProvider(),
      new AnthropicProvider(),
    ];
  }

  getResults() {
    return this.results;
  }

  async sendRequest(request: AiRequest): Promise<AiResponse> {
    this.results = [];
    const availableProviders = this.providers.filter((p) => {
      if (p.name === 'gemini') return !!process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (p.name === 'grok') return !!process.env.EXPO_PUBLIC_GROK_API_KEY;
      if (p.name === 'openrouter') return !!process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
      if (p.name === 'openai') return !!process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (p.name === 'anthropic') return !!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
      return false;
    });

    if (availableProviders.length === 0) {
      return { content: '', tokensUsed: 0, model: 'none', success: false, error: 'No AI providers configured. Please add API keys to .env file.' };
    }

    console.log(`[ProviderChain] ${availableProviders.length} providers available: ${availableProviders.map(p => p.name).join(' → ')}`);

    for (const provider of availableProviders) {
      console.log(`[ProviderChain] Trying ${provider.name}...`);
      try {
        const response = await provider.sendRequest(request);

        if (response.success && response.content) {
          console.log(`[ProviderChain] ${provider.name} succeeded`);
          this.results.push({ provider: provider.name, success: true });
          return response;
        }

        const errMsg = response.error || 'Empty response';
        console.warn(`[ProviderChain] ${provider.name} failed: ${errMsg}`);
        this.results.push({ provider: provider.name, success: false, error: errMsg });

        const isQuotaError = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('rate_limit');
        const isAuthError = errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('invalid') || errMsg.includes('leaked') || errMsg.includes('UNAUTHENTICATED');

        if (isAuthError) {
          console.warn(`[ProviderChain] ${provider.name} auth error, skipping to next provider`);
          continue;
        }

        if (isQuotaError) {
          console.warn(`[ProviderChain] ${provider.name} rate limited, trying next provider`);
          continue;
        }

        continue;
      } catch (error: any) {
        console.error(`[ProviderChain] ${provider.name} threw:`, error?.message);
        this.results.push({ provider: provider.name, success: false, error: error?.message });
      }
    }

    const summary = this.results.map(r => `${r.provider}: ${r.success ? 'OK' : r.error?.substring(0, 50)}`).join('; ');
    return { content: '', tokensUsed: 0, model: 'all-failed', success: false, error: `All providers failed. ${summary}` };
  }
}
