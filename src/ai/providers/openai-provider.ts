import { AiProvider, AiRequest, AiResponse } from '../abstraction/ai-provider';
import { AI_CONFIG } from '../../core/config/app-config';
import { useApiKeyStore } from '../../shared/hooks/use-api-key';

export class GeminiProvider implements AiProvider {
  name = 'gemini';

  async sendRequest(request: AiRequest): Promise<AiResponse> {
    const storeKey = useApiKeyStore.getState().apiKey || '';
    const isValidStoreKey = storeKey.startsWith('AIzaSy');
    const apiKey = (isValidStoreKey ? storeKey : '') || AI_CONFIG.geminiApiKey;
    console.log(`[GeminiProvider] Store key present: ${!!storeKey}, valid format: ${isValidStoreKey}, Config key present: ${!!AI_CONFIG.geminiApiKey}`);
    console.log(`[GeminiProvider] Using key source: ${isValidStoreKey && storeKey ? 'store' : 'config'}`);
    console.log(`[GeminiProvider] Key prefix: ${apiKey.substring(0, 8)}...`);

    if (!apiKey) {
      console.error('[GeminiProvider] No API key configured');
      return {
        content: '',
        tokensUsed: 0,
        model: AI_CONFIG.geminiModel,
        success: false,
        error: 'No Gemini API key configured.',
      };
    }

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.doRequest(apiKey, request);
      if (result.success || result.error?.includes('invalid authentication')) {
        return result;
      }
      if (result.error?.includes('429') || result.error?.includes('RESOURCE_EXHAUSTED') || result.error?.includes('quota')) {
        const retryDelay = attempt * 25000;
        console.warn(`[GeminiProvider] Quota hit, retry ${attempt}/${maxRetries} in ${retryDelay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      return result;
    }
    return this.doRequest(apiKey, request);
  }

  private async doRequest(apiKey: string, request: AiRequest): Promise<AiResponse> {

    const url = `${AI_CONFIG.geminiBaseUrl}/models/${AI_CONFIG.geminiModel}:generateContent?key=${apiKey}`;
    console.log(`[GeminiProvider] URL: ${AI_CONFIG.geminiBaseUrl}/models/${AI_CONFIG.geminiModel}:generateContent`);
    console.log(`[GeminiProvider] Model: ${AI_CONFIG.geminiModel}`);

    const parts: any[] = [{ text: `${request.systemPrompt}\n\n${request.userPrompt}` }];

    if (request.imageBase64 && request.imageMimeType) {
      parts.push({
        inline_data: {
          mime_type: request.imageMimeType,
          data: request.imageBase64,
        },
      });
      console.log(`[GeminiProvider] Image attached: mimeType=${request.imageMimeType}, base64 length=${request.imageBase64.length}`);
    } else {
      console.log(`[GeminiProvider] No image attached`);
    }

    const body = {
      contents: [{ parts }],
      generationConfig: {
        maxOutputTokens: request.maxTokens || AI_CONFIG.maxTokens,
        temperature: request.temperature ?? AI_CONFIG.temperature,
      },
    };

    console.log(`[GeminiProvider] Sending request...`);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log(`[GeminiProvider] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error(`[GeminiProvider] API error: ${errorMessage}`);
        console.error(`[GeminiProvider] Error details:`, JSON.stringify(errorData?.error || {}));
        return {
          content: '',
          tokensUsed: 0,
          model: AI_CONFIG.geminiModel,
          success: false,
          error: errorMessage,
        };
      }

      const data = await response.json();
      console.log(`[GeminiProvider] Response candidates: ${data.candidates?.length || 0}`);
      console.log(`[GeminiProvider] Token usage: ${data.usageMetadata?.totalTokenCount || 0}`);

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

      console.log(`[GeminiProvider] Response text length: ${text.length}`);
      console.log(`[GeminiProvider] Response text preview: ${text.substring(0, 200)}`);

      return {
        content: text,
        tokensUsed,
        model: AI_CONFIG.geminiModel,
        success: true,
      };
    } catch (error: any) {
      console.error(`[GeminiProvider] Network error:`, error?.message);
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
