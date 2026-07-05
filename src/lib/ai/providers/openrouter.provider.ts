/**
 * OpenRouter AI Provider
 * Handles streaming and non-streaming completions through the OpenRouter API.
 */

import { LLMProvider, LLMStreamOptions } from './provider.interface';
import { config } from '@/config/env';

export class OpenRouterProvider implements LLMProvider {
  private url = 'https://openrouter.ai/api/v1/chat/completions';

  async streamCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: LLMStreamOptions
  ): Promise<ReadableStream<Uint8Array>> {
    const apiKey = config.ai.openRouterApiKey || config.ai.openaiApiKey;
    if (!apiKey) {
      throw new Error('No API key configured for OpenRouter provider');
    }

    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://neuron-edu.vercel.app',
        'X-Title': 'Neuron AI Education Platform',
      },
      body: JSON.stringify({
        model: options?.model || config.ai.openRouterModel,
        messages,
        temperature: options?.temperature ?? 0.7,
        stream: true,
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenRouter returned status ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('OpenRouter response body is empty');
    }

    return response.body;
  }

  async generateCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: LLMStreamOptions
  ): Promise<string> {
    const apiKey = config.ai.openRouterApiKey || config.ai.openaiApiKey;
    if (!apiKey) {
      throw new Error('No API key configured for OpenRouter provider');
    }

    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://neuron-edu.vercel.app',
        'X-Title': 'Neuron AI Education Platform',
      },
      body: JSON.stringify({
        model: options?.model || config.ai.openRouterModel,
        messages,
        temperature: options?.temperature ?? 0.7,
        stream: false,
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenRouter returned status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
