import { AiProvider, AiRequest, AiResponse } from '../abstraction/ai-provider';
import { AI_CONFIG } from '../../core/config/app-config';

export class GrokProvider implements AiProvider {
  name = 'grok';

  async sendRequest(request: AiRequest): Promise<AiResponse> {
    const apiKey = AI_CONFIG.grokApiKey;
    if (!apiKey) {
      return { content: '', tokensUsed: 0, model: AI_CONFIG.grokModel, success: false, error: 'No Grok API key configured.' };
    }

    const url = `${AI_CONFIG.grokBaseUrl}/chat/completions`;
    const messages: any[] = [
      { role: 'system', content: request.systemPrompt },
    ];

    const userContent: any[] = [{ type: 'text', text: request.userPrompt }];

    if (request.imageBase64 && request.imageMimeType) {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${request.imageMimeType};base64,${request.imageBase64}`, detail: 'high' },
      });
    }

    messages.push({ role: 'user', content: userContent });

    const body = {
      model: AI_CONFIG.grokModel,
      messages,
      max_tokens: request.maxTokens || AI_CONFIG.maxTokens,
      temperature: request.temperature ?? AI_CONFIG.temperature,
    };

    try {
      console.log(`[Grok] Sending request to ${AI_CONFIG.grokModel}...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });

      console.log(`[Grok] Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
        console.error(`[Grok] Error: ${errorMessage}`);
        return { content: '', tokensUsed: 0, model: AI_CONFIG.grokModel, success: false, error: errorMessage };
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      const tokensUsed = data.usage?.total_tokens || 0;
      console.log(`[Grok] Success: ${text.length} chars, ${tokensUsed} tokens`);

      return { content: text, tokensUsed, model: AI_CONFIG.grokModel, success: true };
    } catch (error: any) {
      console.error(`[Grok] Network error:`, error?.message);
      return { content: '', tokensUsed: 0, model: AI_CONFIG.grokModel, success: false, error: error?.message || 'Network error' };
    }
  }
}
