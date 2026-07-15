import { AiProvider, AiProviderConfig, AiRequest, AiResponse } from '../abstraction/ai-provider';
import { AI_CONFIG } from '../../core/config/app-config';

export interface VisionContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

export class OpenRouterProvider implements AiProvider {
  name = 'openrouter';
  private config: AiProviderConfig;
  private baseUrl: string;

  constructor(config: AiProviderConfig) {
    this.config = {
      model: AI_CONFIG.defaultModel,
      maxTokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      ...config,
    };

    if (config.apiKey?.startsWith('sk-or-')) {
      this.baseUrl = 'https://openrouter.ai/api/v1';
    } else if (config.apiKey?.startsWith('sk-')) {
      this.baseUrl = 'https://api.openai.com/v1';
    } else {
      this.baseUrl = AI_CONFIG.baseUrl;
    }
  }

  async sendRequest(request: AiRequest): Promise<AiResponse> {
    const url = `${this.baseUrl}/chat/completions`;

    const messages: any[] = [
      { role: 'system', content: request.systemPrompt },
    ];

    if (request.imageBase64 && request.imageMimeType) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: request.userPrompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${request.imageMimeType};base64,${request.imageBase64}`,
            },
          },
        ],
      });
    } else {
      messages.push({ role: 'user', content: request.userPrompt });
    }

    const body: any = {
      model: this.baseUrl.includes('openai.com') ? 'gpt-4o-mini' : (this.config.model || 'openai/gpt-4o-mini'),
      messages,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      };

      if (this.baseUrl.includes('openrouter.ai')) {
        headers['HTTP-Referer'] = AI_CONFIG.appUrl;
        headers['X-Title'] = AI_CONFIG.appTitle;
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
          model: body.model,
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
        model: data.model || body.model,
        success: true,
      };
    } catch (error: any) {
      return {
        content: '',
        tokensUsed: 0,
        model: body.model,
        success: false,
        error: error?.message || 'Network error. Please check your connection.',
      };
    }
  }
}
