import { AiProvider, AiRequest, AiResponse } from '../abstraction/ai-provider';
import { AI_CONFIG } from '../../core/config/app-config';

export class OpenAiProvider implements AiProvider {
  name = 'openai';

  async sendRequest(request: AiRequest): Promise<AiResponse> {
    const apiKey = AI_CONFIG.openaiApiKey;
    if (!apiKey) {
      return { content: '', tokensUsed: 0, model: AI_CONFIG.openaiModel, success: false, error: 'No OpenAI API key configured.' };
    }

    const url = `${AI_CONFIG.openaiBaseUrl}/chat/completions`;
    const messages: any[] = [
      { role: 'system', content: request.systemPrompt },
      { role: 'user', content: [] },
    ];

    const userContent: any[] = [{ type: 'text', text: request.userPrompt }];

    if (request.imageBase64 && request.imageMimeType) {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${request.imageMimeType};base64,${request.imageBase64}`, detail: 'high' },
      });
    }

    messages[1].content = userContent;

    const body = {
      model: AI_CONFIG.openaiModel,
      messages,
      max_tokens: request.maxTokens || AI_CONFIG.maxTokens,
      temperature: request.temperature ?? AI_CONFIG.temperature,
    };

    try {
      console.log(`[OpenAI] Sending request to ${AI_CONFIG.openaiModel}...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });

      console.log(`[OpenAI] Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
        console.error(`[OpenAI] Error: ${errorMessage}`);
        return { content: '', tokensUsed: 0, model: AI_CONFIG.openaiModel, success: false, error: errorMessage };
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      const tokensUsed = data.usage?.total_tokens || 0;
      console.log(`[OpenAI] Success: ${text.length} chars, ${tokensUsed} tokens`);

      return { content: text, tokensUsed, model: AI_CONFIG.openaiModel, success: true };
    } catch (error: any) {
      console.error(`[OpenAI] Network error:`, error?.message);
      return { content: '', tokensUsed: 0, model: AI_CONFIG.openaiModel, success: false, error: error?.message || 'Network error' };
    }
  }
}
