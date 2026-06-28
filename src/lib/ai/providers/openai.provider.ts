/**
 * OpenAI Provider
 * Handles streaming and non-streaming completions through the official OpenAI API.
 */

import { LLMProvider, LLMStreamOptions } from './provider.interface';
import { config } from '@/config/env';

export class OpenAIProvider implements LLMProvider {
  private url = 'https://api.openai.com/v1/chat/completions';

  async streamCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: LLMStreamOptions
  ): Promise<ReadableStream<Uint8Array>> {
    const apiKey = config.ai.openaiApiKey;
    if (!apiKey) {
      throw new Error('No API key configured for OpenAI provider');
    }

    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || config.ai.openaiModel,
        messages,
        temperature: options?.temperature ?? 0.7,
        stream: true,
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAI returned status ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('OpenAI response body is empty');
    }

    return response.body;
  }

  async generateCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: LLMStreamOptions
  ): Promise<string> {
    const apiKey = config.ai.openaiApiKey;
    if (!apiKey) {
      throw new Error('No API key configured for OpenAI provider');
    }

    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || config.ai.openaiModel,
        messages,
        temperature: options?.temperature ?? 0.7,
        stream: false,
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAI returned status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
