import { AiProvider } from './ai-provider';
import { ProviderChain } from '../providers/provider-chain';

export class AiProviderFactory {
  static createProvider(): AiProvider {
    return new ProviderChain();
  }
}
