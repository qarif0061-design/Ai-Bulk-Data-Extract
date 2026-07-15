export interface AiProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AiRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AiProvider {
  name: string;
  sendRequest(request: AiRequest): Promise<AiResponse>;
}

export interface AiResponse {
  content: string;
  tokensUsed: number;
  model: string;
  success: boolean;
  error?: string;
  parsedData?: any;
}
