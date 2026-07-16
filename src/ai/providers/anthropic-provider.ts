import { AiProvider, AiRequest, AiResponse } from '../abstraction/ai-provider';
import { AI_CONFIG } from '../../core/config/app-config';

export class AnthropicProvider implements AiProvider {
  name = 'anthropic';

  async sendRequest(request: AiRequest): Promise<AiResponse> {
    const apiKey = AI_CONFIG.anthropicApiKey;
    if (!apiKey) {
      return { content: '', tokensUsed: 0, model: AI_CONFIG.anthropicModel, success: false, error: 'No Anthropic API key configured.' };
    }

    const url = `${AI_CONFIG.anthropicBaseUrl}/messages`;

    const content: any[] = [];

    if (request.imageBase64 && request.imageMimeType) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: request.imageMimeType, data: request.imageBase64 },
      });
    }

    content.push({ type: 'text', text: request.userPrompt });

    const body = {
      model: AI_CONFIG.anthropicModel,
      max_tokens: request.maxTokens || AI_CONFIG.maxTokens,
      temperature: request.temperature ?? AI_CONFIG.temperature,
      system: request.systemPrompt,
      messages: [{ role: 'user', content }],
    };

    try {
      console.log(`[Anthropic] Sending request to ${AI_CONFIG.anthropicModel}...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      console.log(`[Anthropic] Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
        console.error(`[Anthropic] Error: ${errorMessage}`);
        return { content: '', tokensUsed: 0, model: AI_CONFIG.anthropicModel, success: false, error: errorMessage };
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
      console.log(`[Anthropic] Success: ${text.length} chars, ${tokensUsed} tokens`);

      return { content: text, tokensUsed, model: AI_CONFIG.anthropicModel, success: true };
    } catch (error: any) {
      console.error(`[Anthropic] Network error:`, error?.message);
      return { content: '', tokensUsed: 0, model: AI_CONFIG.anthropicModel, success: false, error: error?.message || 'Network error' };
    }
  }
}
