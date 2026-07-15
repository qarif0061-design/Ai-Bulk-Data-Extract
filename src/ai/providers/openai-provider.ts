import { AiProvider, AiRequest, AiResponse } from '../abstraction/ai-provider';
import { AI_CONFIG } from '../../core/config/app-config';
import { useApiKeyStore } from '../../shared/hooks/use-api-key';

export class GeminiProvider implements AiProvider {
  name = 'gemini';

  async sendRequest(request: AiRequest): Promise<AiResponse> {
    const apiKey = useApiKeyStore.getState().apiKey || '';
    if (!apiKey) {
      return {
        content: '',
        tokensUsed: 0,
        model: AI_CONFIG.geminiModel,
        success: false,
        error: 'No Gemini API key configured. Add one in Profile.',
      };
    }

    const url = `${AI_CONFIG.geminiBaseUrl}/models/${AI_CONFIG.geminiModel}:generateContent?key=${apiKey}`;

    const parts: any[] = [{ text: `${request.systemPrompt}\n\n${request.userPrompt}` }];

    if (request.imageBase64 && request.imageMimeType) {
      parts.push({
        inline_data: {
          mime_type: request.imageMimeType,
          data: request.imageBase64,
        },
      });
    }

    const body = {
      contents: [{ parts }],
      generationConfig: {
        maxOutputTokens: request.maxTokens || AI_CONFIG.maxTokens,
        temperature: request.temperature ?? AI_CONFIG.temperature,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        return {
          content: '',
          tokensUsed: 0,
          model: AI_CONFIG.geminiModel,
          success: false,
          error: errorMessage,
        };
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

      return {
        content: text,
        tokensUsed,
        model: AI_CONFIG.geminiModel,
        success: true,
      };
    } catch (error: any) {
      return {
        content: '',
        tokensUsed: 0,
        model: AI_CONFIG.geminiModel,
        success: false,
        error: error?.message || 'Network error. Please check your connection.',
      };
    }
  }
}
