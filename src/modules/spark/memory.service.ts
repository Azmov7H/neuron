/**
 * Memory Service
 * Manages conversation memory context, token budgeting, history window trimming,
 * and future semantic vector database retrieval stubs.
 */

import { SparkMessage } from '@/types';

export class MemoryService {
  /**
   * Trims message history to respect token budgets and model context limits.
   * Standard windowing trims to the last N messages (default: 8).
   */
  static trimHistory(messages: SparkMessage[], limit = 8): Array<{ role: 'user' | 'assistant'; content: string }> {
    return messages
      .slice(-limit)
      .map(msg => ({
        role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: msg.content,
      }));
  }

  /**
   * Placeholder for future vector database similarity queries.
   * Prepares the architecture for semantic search retrieval.
   */
  static async querySemanticMemory(
    _userId: string,
    _query: string,
    _limit = 5
  ): Promise<Array<{ text: string; score: number }>> {
    return [];
  }

  /**
   * Placeholder for storing interactions to long-term memory.
   */
  static async storeSemanticMemory(
    _userId: string,
    _text: string,
    _metadata?: Record<string, unknown>
  ): Promise<void> {
    // No-op
  }
}
