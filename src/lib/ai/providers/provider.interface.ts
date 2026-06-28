/**
 * LLM Provider Interface
 * Abstraction layer to support switching between different AI models and endpoints.
 */

export interface LLMStreamOptions {
  model?: string;
  temperature?: number;
  signal?: AbortSignal;
}

export interface LLMProvider {
  /**
   * Stream the completion response back to the client.
   */
  streamCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: LLMStreamOptions
  ): Promise<ReadableStream<Uint8Array>>;

  /**
   * Generate a full non-streaming completion response.
   */
  generateCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: LLMStreamOptions
  ): Promise<string>;
}
