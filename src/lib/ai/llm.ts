/**
 * AI Integration Template
 * Ready-to-use structure for OpenAI and other LLM integrations
 */

import { config } from '@/config/env';
import { logger } from '@/lib/logger';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/**
 * Spark AI Prompt System
 * Configurable prompts for different learning contexts
 */
export const SPARK_PROMPTS = {
  mentor:
    'You are Spark, an AI learning mentor. Your role is to guide students through complex concepts with clarity and enthusiasm. Adapt explanations to their learning style. Ask clarifying questions. Provide examples when needed.',

  conceptExplainer: `You are explaining a concept to a student who is learning about it for the first time.
    Be clear, concise, and use analogies when helpful. Start with the fundamentals.`,

  mistakeCorrector: `You identified a misconception in the student's understanding.
    Gently correct it by explaining the correct concept, why the misconception occurred, and provide a correct example.`,

  recommendationReasoner: `You are helping explain why a specific learning path or concept is recommended.
    Reference the student's learning history and current level. Make it personal and motivating.`,
};

/**
 * LLM Service (for future integration)
 * This structure is ready for OpenAI, Anthropic, or other LLM APIs
 */
export class LLMService {
  /**
   * Generate completion with given prompt
   */
  static async generateCompletion(
    messages: AIMessage[],
    options: AIGenerationOptions = {}
  ): Promise<string> {
    if (!config.ai.openaiApiKey) {
      logger.warn('[LLM] OpenAI key not configured, using placeholder');
      return 'This is where the AI response would go.';
    }

    // TODO: Implement actual OpenAI API call
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${config.ai.openaiApiKey}`,
    //   },
    //   body: JSON.stringify({
    //     model: config.ai.openaiModel,
    //     messages,
    //     temperature: options.temperature || 0.7,
    //     max_tokens: options.maxTokens || 2000,
    //     top_p: options.topP || 1,
    //   }),
    // });

    // const data = await response.json();
    // return data.choices[0].message.content;

    return 'Placeholder AI response';
  }

  /**
   * Generate embeddings for semantic search
   */
  static async generateEmbedding(_text: string): Promise<number[]> {
    if (!config.ai.openaiApiKey) {
      logger.warn('[LLM] OpenAI key not configured, returning zero vector');
      return new Array(1536).fill(0); // Default OpenAI embedding dimension
    }

    // TODO: Implement actual embedding API call
    // const response = await fetch('https://api.openai.com/v1/embeddings', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${config.ai.openaiApiKey}`,
    //   },
    //   body: JSON.stringify({
    //     model: config.ai.embeddingModel,
    //     input: text,
    //   }),
    // });

    // const data = await response.json();
    // return data.data[0].embedding;

    return new Array(1536).fill(0);
  }

  /**
   * Batch embeddings generation
   */
  static async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.generateEmbedding(text)));
  }

  /**
   * Extract entities/concepts from text
   */
  static async extractEntities(text: string): Promise<string[]> {
    const systemPrompt = `Extract key concepts and entities from the following text. 
    Return as a JSON array of strings. Be concise.`;

    const response = await this.generateCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ]);

    try {
      const match = response.match(/\["[^"]*"(?:,"[^"]*")*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch {
      // Fallback: split by common delimiters
      return text
        .split(/[,.;:!?]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 3);
    }

    return [];
  }
}

/**
 * Caching decorator for expensive AI operations
 */
export function cacheAIResult(ttl: number = 3600) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cache = new Map<string, { result: unknown; expiry: number }>();

    descriptor.value = async function (...args: unknown[]) {
      const cacheKey = JSON.stringify(args);
      const cached = cache.get(cacheKey);

      if (cached && cached.expiry > Date.now()) {
        logger.debug(`[Cache] Hit for ${propertyKey}`);
        return cached.result;
      }

      logger.debug(`[Cache] Miss for ${propertyKey}`);
      const result = await originalMethod.apply(this, args);

      cache.set(cacheKey, {
        result,
        expiry: Date.now() + ttl * 1000,
      });

      return result;
    };

    return descriptor;
  };
}
