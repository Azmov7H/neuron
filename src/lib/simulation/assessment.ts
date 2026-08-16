/**
 * Assessment Source Contract
 * Explicitly distinguishes AI-generated assessments from deterministic
 * local fallback output. The persisted metadata and the client-visible
 * metadata must always agree on the true origin of an assessment.
 */

import { config } from '@/config/env';

export type AssessmentSource = 'ai' | 'deterministic';

export type AssessmentFallbackReason =
  | 'missing_api_key'
  | 'timeout'
  | 'provider_error';

export interface AssessmentMetadata {
  domain: string;
  simulationType: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /**
   * The model (or deterministic generator) that produced the assessment.
   * Never equals the configured AI model when source === 'deterministic'.
   */
  aiModel: string;
  source: AssessmentSource;
  fallbackReason?: AssessmentFallbackReason;
}

/**
 * Clear identifier for the deterministic fallback generator. Must never be
 * confused with a real AI model name.
 */
export const DETERMINISTIC_MODEL = 'neuron-local-deterministic-engine';

export const FALLBACK_REASON_LABELS: Record<AssessmentFallbackReason, string> = {
  missing_api_key: 'no AI API key configured',
  timeout: 'the AI request timed out',
  provider_error: 'the AI provider returned an error',
};

/**
 * Resolves the model name actually configured for the active provider.
 * The LLM's own claims about its identity are never trusted — this is the
 * only model name that may be reported for source === 'ai'.
 */
export function getConfiguredAiModel(): string {
  return config.ai.activeProvider === 'openai'
    ? config.ai.openaiModel
    : config.ai.openRouterModel;
}

export interface BuildAssessmentMetadataInput {
  domain: string;
  simulationId: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  source: AssessmentSource;
  model: string;
  fallbackReason?: AssessmentFallbackReason;
}

/**
 * Single construction point for assessment metadata so the persisted record
 * (SimulationRun) and the streamed METADATA_EVENT can never diverge.
 */
export function buildAssessmentMetadata(
  input: BuildAssessmentMetadataInput
): AssessmentMetadata {
  return {
    domain: input.domain,
    simulationType: input.simulationId,
    difficulty: input.difficulty ?? 'intermediate',
    aiModel: input.model,
    source: input.source,
    ...(input.fallbackReason
      ? { fallbackReason: input.fallbackReason }
      : {}),
  };
}