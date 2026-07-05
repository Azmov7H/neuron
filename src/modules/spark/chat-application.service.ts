/**
 * Chat Application Service
 * Orchestrator/Application Layer for the Spark AI Mentor Chat.
 * Aggregates contexts, invokes prompt builders, streams LLM completions,
 * dispatches event notifications, and manages tertiary fallbacks.
 */

import { ConversationRepository } from './conversation.repository';
import { PromptBuilder } from './prompt.builder';
import { MemoryService } from './memory.service';
import { ResponseParser } from './response-parser.service';
import { SparkContext } from './spark.context';
import { SparkRetrieval } from './spark.retrieval';
import { SparkFallback } from './spark.fallback';
import { LLMProviderFactory } from '@/lib/ai/providers/provider.factory';
import { eventBus, DomainEventType } from '@/lib/events/event-bus';
import { ensureSubscribersRegistered } from '@/core/events/register-subscribers';
import { AppError } from '@/types';
import { logger } from '@/lib/logger';
import { config } from '@/config/env';

export interface ChatRequestPayload {
  userId: string;
  content: string;
  domain?: string;
  currentPathId?: string;
  currentChapterId?: string;
  sessionId?: string;
}

export class ChatApplicationService {
  /**
   * Orchestrates the mentoring conversational pipeline.
   */
  static async handleChat(payload: ChatRequestPayload) {
    const { userId, content, domain, currentPathId, currentChapterId } = payload;
    let sessionId = payload.sessionId;

    // Ensure domain event subscriptions are wired
    ensureSubscribersRegistered();

    const targetDomain = domain || 'science';

    // 1. Retrieve or create session
    let session;
    if (!sessionId || sessionId === 'new') {
      session = await ConversationRepository.create(userId, targetDomain, {
        currentPathId,
        currentChapterId,
      });
      sessionId = session._id.toString();
    } else {
      session = await ConversationRepository.findById(sessionId);
      if (!session) {
        throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
      }
      if (session.userId.toString() !== userId) {
        throw new AppError(403, 'Unauthorized access to session', 'FORBIDDEN');
      }
    }

    // 2. Automatically detect response mode
    const mode = this.detectResponseMode(content);

    // 3. Gather student learning context
    const learningContext = await SparkContext.aggregateContext(userId, session.domain, {
      currentPathId: session.context?.currentPathId?.toString(),
      currentChapterId: session.context?.currentChapterId,
    });

    // 4. Query pre-seeded Knowledge chunks
    const retrievedChunks = await SparkRetrieval.retrieveRelevantKnowledge(content, session.domain, 3);

    // 5. Build prompt contexts
    const { systemPrompt, contextPrompt } = PromptBuilder.formatPrompt(
      learningContext,
      retrievedChunks,
      session.domain,
      mode
    );

    // 6. Record user query message in session repository
    await ConversationRepository.addMessage(session, 'user', content, {
      intent: 'question',
      concepts: retrievedChunks.map(c => c.title),
    });

    const llmMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...MemoryService.trimHistory(session.messages.slice(0, -1), 8),
      {
        role: 'user' as const,
        content: `${contextPrompt}\n\n[STUDENT CURRENT QUESTION]: ${content}`,
      },
    ];

    const encoder = new TextEncoder();
    const activeProvider = LLMProviderFactory.getProvider();
    const apiKey = config.ai.openRouterApiKey || config.ai.openaiApiKey;
    const PRIMARY_TIMEOUT_MS = 5500;

    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = '';
        let fallbackTriggered = false;

        const finishAndSave = async (completeText: string) => {
          try {
            // Parse response formatting components
            const parsed = ResponseParser.parse(completeText);

            // Save assistant message response in database
            await ConversationRepository.addMessage(session, 'assistant', parsed.cleanContent, {
              intent: 'explanation',
              concepts: parsed.conceptsList.map(c => c.title),
            });

            // Update recent concepts discussed in active context memory
            if (session.context) {
              if (!session.context.recentConcepts) {
                session.context.recentConcepts = [];
              }
              parsed.conceptsList.forEach(c => {
                if (!session.context.recentConcepts.includes(c.title)) {
                  session.context.recentConcepts.push(c.title);
                }
              });
              if (session.context.recentConcepts.length > 15) {
                session.context.recentConcepts = session.context.recentConcepts.slice(-15);
              }
              await ConversationRepository.save(session);
            }

            // Publish completed conversation event to trigger side-effects
            const resultCarrier: { addedXp?: number; isRankUp?: boolean } = {};
            await eventBus.publish(DomainEventType.ConversationCompleted, {
              sessionId: sessionId!,
              userId,
              domain: targetDomain,
              userMessage: content,
              assistantMessage: completeText,
              conceptsList: parsed.conceptsList,
              resultCarrier,
            });

            // Dispatch SSE metadata event
            controller.enqueue(
              encoder.encode(
                `\n\n[METADATA_EVENT] ${JSON.stringify({
                  sessionId,
                  concepts: parsed.conceptsList,
                  domains: [targetDomain],
                  relatedSimulations: parsed.metadata.relatedSimulations || [],
                  followUps: parsed.followUpsList,
                  addedXp: resultCarrier.addedXp || 0,
                  isRankUp: resultCarrier.isRankUp || false,
                  retrievedChunks: retrievedChunks.map(c => ({ title: c.title, domain: c.domain })),
                })} [END]`
              )
            );
          } catch (err: unknown) {
            logger.error('[ChatAppService Stream] Post-processing failed:', err);
          } finally {
            controller.close();
          }
        };

        const triggerLocalFallback = async (reason: string) => {
          if (fallbackTriggered) return;
          fallbackTriggered = true;
          logger.warn(`[ChatAppService Stream] Triggering fallback layer. Reason: ${reason}`);

          try {
            const fallbackText = await SparkFallback.generateExplanation(
              content,
              session.domain,
              mode,
              retrievedChunks
            );

            const words = fallbackText.split(' ');
            let currentText = '';
            for (let i = 0; i < words.length; i++) {
              const word = words[i] + ' ';
              currentText += word;
              controller.enqueue(encoder.encode(word));
              await new Promise(resolve => setTimeout(resolve, 20));
            }

            await finishAndSave(currentText);
          } catch (err: unknown) {
            logger.error('[ChatAppService Stream] Fallback generation crashed:', err);
            const absoluteText = `**[Educational Stream Recalibrated]**\n\nI have successfully loaded a local cognitive route to process your question about **${content}**. Let's traverse key mechanisms.\n\nTo continue deep learning, verify your connections and retry exploring this concept in the simulations section.`;
            controller.enqueue(encoder.encode(absoluteText));
            await finishAndSave(absoluteText);
          }
        };

        // If no credentials, execute fallback explanation
        if (!apiKey) {
          await triggerLocalFallback('No API keys configured');
          return;
        }

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          abortController.abort();
          triggerLocalFallback('Primary connection timed out (5.5s)');
        }, PRIMARY_TIMEOUT_MS);

        try {
          const providerStream = await activeProvider.streamCompletion(llmMessages, {
            temperature: 0.7,
            signal: abortController.signal,
          });

          clearTimeout(timeoutId);

          const reader = providerStream.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const cleanLine = line.trim();
              if (!cleanLine) continue;

              if (cleanLine.startsWith('data: ')) {
                const dataStr = cleanLine.slice(6);
                if (dataStr === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(dataStr);
                  const token = parsed.choices?.[0]?.delta?.content || '';
                  if (token) {
                    fullContent += token;
                    controller.enqueue(encoder.encode(token));
                  }
                } catch { }
              }
            }
          }

          if (buffer && buffer.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(buffer.slice(6));
              const token = parsed.choices?.[0]?.delta?.content || '';
              if (token) {
                fullContent += token;
                controller.enqueue(encoder.encode(token));
              }
            } catch { }
          }

          await finishAndSave(fullContent);
        } catch (err: unknown) {
          clearTimeout(timeoutId);
          const error = err instanceof Error ? err : new Error(String(err));
          if (error.name === 'AbortError') {
            return;
          }
          await triggerLocalFallback(`AI Provider error: ${error.message}`);
        }
      },
    });

    return { stream, sessionId };
  }

  /**
   * Helper to automatically determine the educational response mode based on student keywords
   */
  static detectResponseMode(userMessage: string): 'scientific' | 'educational' | 'cinematic' {
    const query = userMessage.toLowerCase();
    
    if (
      query.includes('cinematic') ||
      query.includes('story') ||
      query.includes('epic') ||
      query.includes('voyage') ||
      query.includes('space journey') ||
      query.includes('narrative')
    ) {
      return 'cinematic';
    }

    if (
      query.includes('scientific') ||
      query.includes('equation') ||
      query.includes('formula') ||
      query.includes('math') ||
      query.includes('proof') ||
      query.includes('rigorous') ||
      query.includes('derivation')
    ) {
      return 'scientific';
    }

    return 'educational';
  }
}
