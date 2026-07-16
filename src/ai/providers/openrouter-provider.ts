import { AiProvider, AiRequest, AiResponse } from '../abstraction/ai-provider';
import { AI_CONFIG } from '../../core/config/app-config';

export class OpenRouterProvider implements AiProvider {
  name = 'openrouter';

  async sendRequest(request: AiRequest): Promise<AiResponse> {
    const apiKey = AI_CONFIG.openrouterApiKey;
    if (!apiKey) {
      return { content: '', tokensUsed: 0, model: AI_CONFIG.openrouterModel, success: false, error: 'No OpenRouter API key configured.' };
    }

    const url = `${AI_CONFIG.openrouterBaseUrl}/chat/completions`;
    const messages: any[] = [
      { role: 'system', content: request.systemPrompt },
    ];

    const userContent: any[] = [{ type: 'text', text: request.userPrompt }];

    if (request.imageBase64 && request.imageMimeType) {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${request.imageMimeType};base64,${request.imageBase64}` },
      });
    }

    messages.push({ role: 'user', content: userContent });

    const body = {
      model: AI_CONFIG.openrouterModel,
      messages,
      max_tokens: request.maxTokens || AI_CONFIG.maxTokens,
      temperature: request.temperature ?? AI_CONFIG.temperature,
    };

    try {
      console.log(`[OpenRouter] Sending request to ${AI_CONFIG.openrouterModel}...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://ai-bulk-data-extractor.app',
          'X-Title': 'AI Bulk Data Extractor',
        },
        body: JSON.stringify(body),
      });

      console.log(`[OpenRouter] Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
        console.error(`[OpenRouter] Error: ${errorMessage}`);
        return { content: '', tokensUsed: 0, model: AI_CONFIG.openrouterModel, success: false, error: errorMessage };
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      const tokensUsed = data.usage?.total_tokens || 0;
      console.log(`[OpenRouter] Success: ${text.length} chars, ${tokensUsed} tokens`);

      return { content: text, tokensUsed, model: AI_CONFIG.openrouterModel, success: true };
    } catch (error: any) {
      console.error(`[OpenRouter] Network error:`, error?.message);
      return { content: '', tokensUsed: 0, model: AI_CONFIG.openrouterModel, success: false, error: error?.message || 'Network error' };
    }
  }
}
