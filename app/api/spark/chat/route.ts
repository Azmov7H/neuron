/**
 * POST /api/spark/chat
 * Secure, server-side streaming API route for Spark AI Mentor.
 * Employs a 3-tier Hybrid Cognitive System:
 * 1. Primary Layer: OpenRouter LLM stream with 5.5s connection timeout.
 * 2. Secondary Layer: Pre-seeded MongoDB Knowledge Retrieval.
 * 3. Tertiary Layer: Concept Graph Traversal and offline template generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { SparkService } from '@/modules/spark/spark.service';
import { AppError } from '@/types';

const MODEL_NAME = process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PRIMARY_TIMEOUT_MS = 5500; // 5.5 seconds threshold

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) {
    return ApiResponseHandler.unauthorized();
  }

  await connectDB();

  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponseHandler.badRequest('Invalid request body');
  }

  const { content, domain, currentPathId, currentChapterId } = body;
  let sessionId = body.sessionId;

  if (!content) {
    return ApiResponseHandler.badRequest('Message content is required');
  }

  const targetDomain = domain || 'science';

  // 1. Create session if missing
  if (!sessionId || sessionId === 'new') {
    try {
      const session = await SparkService.createSession(auth.userId, targetDomain, {
        currentPathId,
        currentChapterId
      });
      sessionId = session._id.toString();
    } catch (err: any) {
      console.error('[Spark API] Session creation failed:', err);
      return ApiResponseHandler.error(new AppError(500, err.message || 'Session creation failed', 'SESSION_CREATION_FAILED'));
    }
  }

  // 2. Prepare LLM context parameter aggregation
  let requestParams;
  try {
    requestParams = await SparkService.prepareLLMRequest(sessionId, auth.userId, content);
  } catch (err: any) {
    console.error('[Spark API] Preparing context parameters failed:', err);
    return ApiResponseHandler.error(new AppError(err.statusCode || 500, err.message || 'Preparing context failed', err.code || 'CONTEXT_PREPARATION_FAILED'));
  }

  const { llmMessages, retrievedChunks } = requestParams;
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';

  const encoder = new TextEncoder();

  // Custom streaming response
  const stream = new ReadableStream({
    async start(controller) {
      let fullContent = '';
      let fallbackTriggered = false;

      const finishAndSave = async (completeText: string) => {
        try {
          const result = await SparkService.saveAssistantResponse(sessionId, auth.userId, completeText);

          // Send unified custom metadata SSE event
          controller.enqueue(
            encoder.encode(
              `\n\n[METADATA_EVENT] ${JSON.stringify({
                sessionId,
                concepts: result.concepts,
                domains: [targetDomain],
                relatedSimulations: result.simulations || [],
                followUps: result.followUps,
                addedXp: result.addedXp,
                isRankUp: result.isRankUp,
                retrievedChunks: retrievedChunks.map(c => ({ title: c.title, domain: c.domain }))
              })} [END]`
            )
          );
        } catch (err) {
          console.error('[Spark API Stream] Background post-processing failed:', err);
        } finally {
          controller.close();
        }
      };

      const triggerLocalFallback = async (reason: string) => {
        if (fallbackTriggered) return;
        fallbackTriggered = true;
        console.warn(`[Spark API Stream] Triggering fallback layer. Reason: ${reason}`);

        try {
          const fallbackText = await SparkService.generateLocalFallback(sessionId, auth.userId, content);

          // Stream prebuilt explanation word-by-word
          const words = fallbackText.split(' ');
          let currentText = '';
          for (let i = 0; i < words.length; i++) {
            const word = words[i] + ' ';
            currentText += word;
            controller.enqueue(encoder.encode(word));
            await new Promise(resolve => setTimeout(resolve, 20)); // Immersive streaming delay
          }

          await finishAndSave(currentText);
        } catch (err) {
          console.error('[Spark API Stream] Fallback generation crashed:', err);
          // Absolute failover: guarantee standard content to prevent blank pages
          const absoluteText = `**[Educational Stream Recalibrated]**\n\nI have successfully loaded a local cognitive route to process your question about **${content}**. Let's traverse key mechanisms.\n\nTo continue deep learning, verify your connections and retry exploring this concept in the simulations section.`;
          controller.enqueue(encoder.encode(absoluteText));
          await finishAndSave(absoluteText);
        }
      };

      // 1. Direct check: If API key is missing, immediately run fallback
      if (!apiKey) {
        await triggerLocalFallback('No API keys configured');
        return;
      }

      // 2. OpenRouter live stream with AbortController for primary timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
        triggerLocalFallback('Primary connection timed out (5.5s)');
      }, PRIMARY_TIMEOUT_MS);

      try {
        const response = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://neuron-edu.vercel.app',
            'X-Title': 'Neuron AI Education Platform'
          },
          body: JSON.stringify({
            model: MODEL_NAME,
            messages: llmMessages,
            temperature: 0.7,
            stream: true,
          }),
          signal: abortController.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`OpenRouter returned status ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) {
          throw new Error('Response body has no reader');
        }

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
              } catch {
                // Ignore SSE line parsing anomalies
              }
            }
          }
        }

        // Deal with leftover buffer
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
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          // Handled inside timeout callback
          return;
        }
        // Connection or status failures: recover with fallback
        await triggerLocalFallback(`OpenRouter connection error: ${err.message}`);
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

export const POST = withErrorHandling(requireAuth(handler));
