import { AiProvider, AiProviderConfig, AiRequest, AiResponse } from '../abstraction/ai-provider';
import { AI_CONFIG } from '../../core/config/app-config';

export class OpenRouterProvider implements AiProvider {
  name = 'openrouter';
  private config: AiProviderConfig;

  constructor(config: AiProviderConfig) {
    this.config = {
      baseUrl: AI_CONFIG.baseUrl,
      model: AI_CONFIG.defaultModel,
      maxTokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      ...config,
    };
  }

  async sendRequest(request: AiRequest): Promise<AiResponse> {
    const url = `${this.config.baseUrl}/chat/completions`;

    const body = {
      model: this.config.model,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'HTTP-Referer': AI_CONFIG.appUrl,
        'X-Title': AI_CONFIG.appTitle,
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        return {
          content: '',
          tokensUsed: 0,
          model: this.config.model || '',
          success: false,
          error: errorMessage,
        };
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const content = choice?.message?.content || '';
      const tokensUsed = data.usage?.total_tokens || 0;

      return {
        content,
        tokensUsed,
        model: data.model || this.config.model || '',
        success: true,
      };
    } catch (error: any) {
      return {
        content: '',
        tokensUsed: 0,
        model: this.config.model || '',
        success: false,
        error: error?.message || 'Network error. Please check your connection.',
      };
    }
  }
}
