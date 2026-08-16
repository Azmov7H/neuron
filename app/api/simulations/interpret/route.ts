import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth, withRateLimit } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { logger } from '@/lib/logger';
import { SimulationRun } from '@/database/models/simulation-run';
import { LLMProviderFactory } from '@/lib/ai/providers/provider.factory';
import { config } from '@/config/env';
import mongoose from 'mongoose';
import { requireSimulationCsrfProtection } from '@/lib/security/simulation-security';
import { validateSimulationRun, SimulationRunCreateSchema } from '@/lib/security/validation';
import { clampSimulationParameters } from '@/lib/simulation/schemas';
import { sanitizeSnapshot } from '@/lib/simulation/snapshot-sanitize';
import type { ScientificDomain } from '@/lib/simulation/registry.types';
import { generateLocalSimulationFallback } from '@/lib/simulation/deterministic-fallback';
import {
  DETERMINISTIC_MODEL,
  buildAssessmentMetadata,
  getConfiguredAiModel,
  type AssessmentFallbackReason,
  type AssessmentMetadata,
  type AssessmentSource,
} from '@/lib/simulation/assessment';

const PRIMARY_TIMEOUT_MS = 6000; // 6 seconds threshold

// Expensive AI endpoint: far tighter than the default 100 req/min global limit.
const INTERPRET_RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_INTERPRET_MAX ?? '20', 10);
const INTERPRET_RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_INTERPRET_WINDOW_MS ?? String(config.rateLimit.windowMs),
  10
);

// Spark Stream Telemetry API Handler
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

  // Validate request body against schema
  let validatedData;
  try {
    validatedData = validateSimulationRun(body, SimulationRunCreateSchema);
    if (!validatedData.parameters) {
      throw new Error('Parameters are required');
    }
    if (!validatedData.metrics) {
      validatedData.metrics = {};
    }
    if (validatedData.entities) {
      // Convert unvalidated entities to properly typed array
      validatedData.entities = Array.isArray(validatedData.entities) ? 
        validatedData.entities.map((ent: Record<string, unknown>, idx: number) => ({ ...ent, id: (ent.id as string) || `entity-${idx}` })) : 
        [];
    } else {
      validatedData.entities = [];
    }
    // Replace original body with validated data
    Object.assign(body, validatedData);
  } catch (validationError) {
    logger.warn('[Simulation API] Validation failed:', validationError instanceof Error ? validationError.message : 'Unknown validation error');
    return ApiResponseHandler.badRequest(validationError instanceof Error ? validationError.message : 'Invalid request data');
  }

  const { domain, simulationId, parameters, stateSnapshot, stateType, simulationTime, userQuestion } = validatedData;

  // ASSESS-02 (server boundary): the same sanitizer the client engine uses at
  // telemetry emission must guard ingestion too. A bypassing client can post a
  // raw snapshot containing NaN/Infinity — sanitize before it can reach the
  // LLM prompt or the persisted SimulationRun row.
  const safeSnapshot = sanitizeSnapshot(stateSnapshot ?? {});

  // P3 runtime audit (VAL-01): the registry is the authoritative parameter
  // boundary. Reject unknown simulation IDs outright (they would silently fall
  // into a wrong else-branch and be persisted) and clamp every submitted
  // parameter into its registry range so no NaN/Infinity-producing value can
  // reach the LLM prompt, the deterministic fallback, or the persisted run.
  const bounded = clampSimulationParameters(simulationId, domain.toLowerCase() as ScientificDomain, parameters || {});
  if (!bounded.simulation) {
    return ApiResponseHandler.badRequest(`Unknown simulation: ${simulationId}`);
  }
  if (bounded.changed.length > 0) {
    logger.warn(
      `[Simulation API] Parameters clamped for ${simulationId}: ${bounded.changed.join(', ')}`
    );
  }
  // Enforce the registry boundary on the live payload: replace every submitted
  // value with its clamped form and drop keys the registry does not declare or
  // values that are not finite. clampSimulationParameters only emits finite
  // in-registry entries, so after this the LLM prompt, the deterministic
  // fallback, and the persisted SimulationRun can never observe an
  // unsanitized parameter (VAL-01).
  if (parameters && typeof parameters === 'object') {
    for (const key of Object.keys(parameters)) {
      if (key in bounded.clamped) {
        parameters[key] = bounded.clamped[key];
      } else {
        delete parameters[key];
      }
    }
  }

  const targetQuestion = userQuestion ? userQuestion.trim().replace(/[<>]/g, '') : 'Explain the current simulation telemetry and recommend variables adjustments.';
  const apiKey = config.ai.openRouterApiKey || config.ai.openaiApiKey;
  const encoder = new TextEncoder();
  const activeProvider = LLMProviderFactory.getProvider();

  // Create stream channel
  const stream = new ReadableStream({
    async start(controller) {
      let fullResponseText = '';
      let fallbackTriggered = false;

      const finishAndPersist = async (
        completeText: string,
        source: AssessmentSource,
        model: string,
        fallbackReason?: AssessmentFallbackReason
      ) => {
        try {
          // Parse sections from the text response
          const explanationSec = completeText.split('[EXPLANATION]')[1]?.split('---')[0]?.trim() || '';
          
          const insightsSec = completeText.split('[KEY INSIGHTS]')[1]?.split('---')[0]?.trim() || 
                              completeText.split('[KEY POINTS]')[1]?.split('---')[0]?.trim() || '';
          const insightsArr = insightsSec
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-'))
            .map(line => line.replace(/^-\s+/, ''));

          const conceptsSec = completeText.split('[CONCEPTS]')[1]?.split('---')[0]?.trim() || '';
          const conceptsArr = conceptsSec
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-'))
            .map(line => line.replace(/^-\s+/, ''));

          const recommendedSec = completeText.split('[RECOMMENDED ACTIONS]')[1]?.split('---')[0]?.trim() || 
                                 completeText.split('[FOLLOW UPS]')[1]?.split('---')[0]?.trim() || '';
          const recommendedArr = recommendedSec
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-'))
            .map(line => line.replace(/^-\s+/, ''));

          const metaText = completeText.split('[METADATA]')[1]?.trim() || '{}';
          let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
          try {
            const m = JSON.parse(metaText);
            if (m.difficulty === 'beginner' || m.difficulty === 'advanced') {
              difficulty = m.difficulty;
            }
          } catch {}

          // Single metadata construction point: the exact object persisted to
          // SimulationRun is the exact object streamed back to the client.
          const metadata: AssessmentMetadata = buildAssessmentMetadata({
            domain,
            simulationId,
            difficulty,
            source,
            model,
            fallbackReason,
          });

          const parsedInterpretation = {
            explanation: explanationSec || completeText.split('---')[0]?.trim() || completeText,
            keyInsights: insightsArr.length > 0 ? insightsArr : ['Parameters calibrated correctly.', 'Dynamic system is in motion.'],
            concepts: conceptsArr.length > 0 ? conceptsArr : [domain.toUpperCase()],
            recommendedActions: recommendedArr.length > 0 ? recommendedArr : ['Tweak the sliders to see variable effects.'],
            metadata,
          };

          // Save simulation run to MongoDB persistence layer
          await SimulationRun.create({
            simulationId,
            userId: new mongoose.Types.ObjectId(auth.userId),
            domain,
            parameters,
stateSnapshot: safeSnapshot,
            aiInterpretation: parsedInterpretation,
            timestamp: new Date()
          });

          // Enqueue SSE custom metadata payload event at the end
          controller.enqueue(
            encoder.encode(
              `\n\n[METADATA_EVENT] ${JSON.stringify({
                domain,
                simulationId,
                interpretation: parsedInterpretation
              })} [END]`
            )
          );
        } catch (err) {
          logger.error('[Simulation API Stream] Failed to parse and save run details:', err);
        } finally {
          controller.close();
        }
      };

      const triggerLocalFallback = async (reason: AssessmentFallbackReason, detail: string) => {
        if (fallbackTriggered) return;
        fallbackTriggered = true;
        logger.warn(`[Simulation API Stream] Fallback activated. Reason: ${reason} (${detail})`);

        try {
          const fallbackText = generateLocalSimulationFallback(domain, simulationId, parameters || {}, reason);
          
          // Stream word-by-word
          const words = fallbackText.split(' ');
          let accumulated = '';
          for (let i = 0; i < words.length; i++) {
            const word = words[i] + ' ';
            accumulated += word;
            controller.enqueue(encoder.encode(word));
            await new Promise(resolve => setTimeout(resolve, 15)); // smooth streaming simulation
          }
          await finishAndPersist(accumulated, 'deterministic', DETERMINISTIC_MODEL, reason);
        } catch (err) {
          logger.error('[Simulation API Stream] Extreme failover crash:', err);
          const metadata = buildAssessmentMetadata({
            domain,
            simulationId,
            source: 'deterministic',
            model: DETERMINISTIC_MODEL,
            fallbackReason: reason,
          });
          const absoluteFallback = `[EXPLANATION]\nScientific systems running normally. The deterministic engine is executing mathematical steps in the background.\n\n---\n\n[KEY INSIGHTS]\n- Dynamic state is fully active.\n\n---\n\n[CONCEPTS]\n- Simulation Engine\n\n---\n\n[RECOMMENDED ACTIONS]\n- Modify sliders to check physical results.\n\n---\n\n[METADATA]\n${JSON.stringify(metadata)}`;
          controller.enqueue(encoder.encode(absoluteFallback));
          await finishAndPersist(absoluteFallback, 'deterministic', DETERMINISTIC_MODEL, reason);
        }
      };

      // 1. Direct check: No API key -> immediate fallback
      if (!apiKey) {
        await triggerLocalFallback('missing_api_key', 'No API keys configured in environment');
        return;
      }

      // 2. LLM provider stream with AbortController for primary timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
        triggerLocalFallback('timeout', `Primary connection timed out (${PRIMARY_TIMEOUT_MS / 1000}.0s)`);
      }, PRIMARY_TIMEOUT_MS);

      // Construct prompt using the AI PROMPT INJECTION TEMPLATE
      const systemPrompt = `You are Spark AI, an educational scientific interpreter inside Neuron.
You do NOT calculate physics or simulate systems.
You ONLY explain simulation results in a clear, structured educational way.`;

      const userPrompt = `CONTEXT:
- Simulation Domain: ${domain}
- Simulation State: ${JSON.stringify(safeSnapshot)}
- Simulation State Type: ${stateType || 'unknown'} (dynamic = real measured state, parameterized_visualization = parameter-driven render, conceptual = no dynamic state)
- Simulation Time (seconds): ${simulationTime ?? 'n/a'}
- Parameters: ${JSON.stringify(parameters || {})}

USER:
${targetQuestion}

OUTPUT RULES:
- structured explanation only
- no extra formatting outside allowed schema
- no system messages
- no storytelling unless requested

Strictly formatted as:
[EXPLANATION]
Explain the current state clearly.

---

[KEY INSIGHTS]
- list the primary telemetry observations

---

[CONCEPTS]
- list relevant scientific term titles

---

[RECOMMENDED ACTIONS]
- suggest variables modifications

---

[METADATA]
{
  "domain": "${domain}",
  "simulationType": "${simulationId}",
  "difficulty": "beginner" | "intermediate" | "advanced"
}`;

      try {
        const providerStream = await activeProvider.streamCompletion(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          {
            temperature: 0.5,
            signal: abortController.signal,
          }
        );

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
                  fullResponseText += token;
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
              fullResponseText += token;
              controller.enqueue(encoder.encode(token));
            }
          } catch { }
        }

        await finishAndPersist(fullResponseText, 'ai', getConfiguredAiModel());
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const error = err instanceof Error ? err : new Error(String(err));
        if (error.name === 'AbortError') return;
        await triggerLocalFallback('provider_error', `LLM provider connection error: ${error.message}`);
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

export const POST = withErrorHandling(
  requireSimulationCsrfProtection(
    requireAuth(withRateLimit(handler, INTERPRET_RATE_LIMIT_MAX, INTERPRET_RATE_LIMIT_WINDOW_MS))
  )
);