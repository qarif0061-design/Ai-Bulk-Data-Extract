export class AiResponseImpl {
  content: string;
  tokensUsed: number;
  model: string;
  success: boolean;
  error?: string;
  parsedData?: any;

  constructor(params: {
    content: string;
    tokensUsed: number;
    model: string;
    success: boolean;
    error?: string;
  }) {
    this.content = params.content;
    this.tokensUsed = params.tokensUsed;
    this.model = params.model;
    this.success = params.success;
    this.error = params.error;
    this.parsedData = this.tryParse();
  }

  private tryParse(): any {
    if (!this.success || !this.content) return null;
    try {
      const cleaned = this.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      try {
        const jsonMatch = this.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Return raw content as-is
      }
      return { raw: this.content };
    }
  }

  static success(content: string, tokensUsed: number, model: string): AiResponseImpl {
    return new AiResponseImpl({ content, tokensUsed, model, success: true });
  }

  static failure(error: string, model: string): AiResponseImpl {
    return new AiResponseImpl({ content: '', tokensUsed: 0, model, success: false, error });
  }
}
