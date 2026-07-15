import { AiResponse } from '../abstraction/ai-provider';

export interface MergedResult {
  data: any;
  totalTokensUsed: number;
  fileCount: number;
  errors: string[];
}

export class ResultMerger {
  static merge(responses: { fileName: string; response: AiResponse }[]): MergedResult {
    const merged: MergedResult = {
      data: {},
      totalTokensUsed: 0,
      fileCount: responses.length,
      errors: [],
    };

    for (const { fileName, response } of responses) {
      merged.totalTokensUsed += response.tokensUsed;

      if (!response.success) {
        merged.errors.push(`${fileName}: ${response.error || 'Unknown error'}`);
        continue;
      }

      const parsed = this.parseResponse(response.content);
      if (parsed) {
        this.mergeParsedData(merged.data, parsed, fileName);
      }
    }

    return merged;
  }

  private static parseResponse(content: string): any {
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch {
        // ignore
      }
      return { raw: content };
    }
  }

  private static mergeParsedData(target: any, source: any, fileName: string): void {
    for (const key of Object.keys(source)) {
      if (Array.isArray(source[key])) {
        if (!target[key]) {
          target[key] = [];
        }
        target[key] = target[key].concat(
          source[key].map((item: any) => ({
            ...item,
            _sourceFile: fileName,
          }))
        );
      } else if (typeof source[key] === 'object' && source[key] !== null) {
        if (!target[key]) {
          target[key] = {};
        }
        target[key] = { ...target[key], ...source[key] };
      } else {
        if (!target[key]) {
          target[key] = source[key];
        }
      }
    }
  }

  static flattenForExport(data: any): Record<string, any>[] {
    const arrays = Object.values(data).filter(Array.isArray) as any[][];
    if (arrays.length === 0) return [];

    const flatArray: Record<string, any>[] = [];
    for (const arr of arrays) {
      for (const item of arr) {
        const flat: Record<string, any> = {};
        for (const [key, value] of Object.entries(item)) {
          if (key.startsWith('_')) continue;
          if (typeof value === 'object' && value !== null) {
            flat[key] = JSON.stringify(value);
          } else {
            flat[key] = value;
          }
        }
        flatArray.push(flat);
      }
    }
    return flatArray;
  }
}
