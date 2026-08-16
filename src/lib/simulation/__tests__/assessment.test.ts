import { describe, it, expect } from 'vitest';
import {
  DETERMINISTIC_MODEL,
  buildAssessmentMetadata,
  getConfiguredAiModel,
  FALLBACK_REASON_LABELS,
  type AssessmentMetadata,
} from '../assessment';

describe('assessment metadata contract', () => {
  it('builds honest metadata for real AI output', () => {
    const metadata = buildAssessmentMetadata({
      domain: 'physics',
      simulationId: 'relativity',
      source: 'ai',
      model: 'google/gemma-4-26b-a4b-it:free',
    });
    expect(metadata.source).toBe('ai');
    expect(metadata.aiModel).toBe('google/gemma-4-26b-a4b-it:free');
    expect(metadata.fallbackReason).toBeUndefined();
    expect(metadata.difficulty).toBe('intermediate');
  });

  it('builds honest metadata for the deterministic fallback', () => {
    const metadata = buildAssessmentMetadata({
      domain: 'physics',
      simulationId: 'relativity',
      source: 'deterministic',
      model: DETERMINISTIC_MODEL,
      fallbackReason: 'missing_api_key',
    });
    expect(metadata.source).toBe('deterministic');
    expect(metadata.aiModel).toBe(DETERMINISTIC_MODEL);
    expect(metadata.fallbackReason).toBe('missing_api_key');
  });

  it('never assigns an AI model to deterministic output', () => {
    const metadata = buildAssessmentMetadata({
      domain: 'physics',
      simulationId: 'relativity',
      source: 'deterministic',
      model: DETERMINISTIC_MODEL,
    });
    expect(metadata.aiModel).not.toMatch(/gemma|gpt/i);
  });

  it('records timeout and provider_error reasons explicitly', () => {
    const timeout = buildAssessmentMetadata({
      domain: 'physics', simulationId: 'motion', source: 'deterministic',
      model: DETERMINISTIC_MODEL, fallbackReason: 'timeout',
    });
    const providerError = buildAssessmentMetadata({
      domain: 'physics', simulationId: 'motion', source: 'deterministic',
      model: DETERMINISTIC_MODEL, fallbackReason: 'provider_error',
    });
    expect(timeout.fallbackReason).toBe('timeout');
    expect(providerError.fallbackReason).toBe('provider_error');
  });

  it('produces a metadata object that round-trips through JSON unchanged', () => {
    const metadata: AssessmentMetadata = buildAssessmentMetadata({
      domain: 'physics',
      simulationId: 'motion',
      source: 'deterministic',
      model: DETERMINISTIC_MODEL,
      fallbackReason: 'timeout',
    });
    const roundTripped = JSON.parse(JSON.stringify(metadata)) as AssessmentMetadata;
    expect(roundTripped).toEqual(metadata);
  });

  it('exposes the configured AI model name — never the fallback label', () => {
    const configured = getConfiguredAiModel();
    expect(configured.length).toBeGreaterThan(0);
    expect(configured).not.toBe(DETERMINISTIC_MODEL);
  });

  it('provides human-readable labels for every fallback reason', () => {
    expect(FALLBACK_REASON_LABELS).toMatchObject({
      missing_api_key: expect.any(String),
      timeout: expect.any(String),
      provider_error: expect.any(String),
    });
  });
});