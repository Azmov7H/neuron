/**
 * LLM Provider Factory
 * Resolves the configured LLMProvider instance at runtime.
 */

import { LLMProvider } from './provider.interface';
import { OpenRouterProvider } from './openrouter.provider';
import { OpenAIProvider } from './openai.provider';
import { config } from '@/config/env';

export class LLMProviderFactory {
  /**
   * Resolve provider by configuration or direct request.
   */
  static getProvider(providerType?: string): LLMProvider {
    const type = providerType || config.ai.activeProvider || 'openrouter';

    switch (type.toLowerCase()) {
      case 'openai':
        return new OpenAIProvider();
      case 'openrouter':
      default:
        return new OpenRouterProvider();
    }
  }
}
