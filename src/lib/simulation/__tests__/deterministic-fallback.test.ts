import { describe, it, expect } from 'vitest';
import { generateLocalSimulationFallback } from '../deterministic-fallback';
import { DETERMINISTIC_MODEL } from '../assessment';

function parseMetadata(output: string): Record<string, unknown> {
  const raw = output.split('[METADATA]')[1]?.trim();
  expect(raw).toBeDefined();
  return JSON.parse(raw as string) as Record<string, unknown>;
}

describe('deterministic fallback assessment generator', () => {
  it('always identifies itself as deterministic', () => {
    const output = generateLocalSimulationFallback('physics', 'relativity', { speed: 0.5 });
    const metadata = parseMetadata(output);
    expect(metadata.source).toBe('deterministic');
    expect(metadata.aiModel).toBe(DETERMINISTIC_MODEL);
  });

  it('never claims the configured AI model as its source', () => {
    const output = generateLocalSimulationFallback('physics', 'relativity', { speed: 0.5 });
    expect(output).not.toContain('gemma');
    expect(output).not.toContain('gpt');
    expect(output).toContain(DETERMINISTIC_MODEL);
  });

  it('records the fallback reason when one is given', () => {
    const output = generateLocalSimulationFallback('biology', 'bacteria', {}, 'timeout');
    expect(parseMetadata(output).fallbackReason).toBe('timeout');
  });

  it('omits the fallback reason when none applies', () => {
    const output = generateLocalSimulationFallback('biology', 'bacteria', {});
    expect(parseMetadata(output).fallbackReason).toBeUndefined();
  });

  it('produces realistic body content for a real simulation', () => {
    const output = generateLocalSimulationFallback('physics', 'relativity', { speed: 0.5 });
    expect(output).toContain('[EXPLANATION]');
    expect(output).toContain('Lorentz');
    expect(output).toContain('[KEY INSIGHTS]');
    expect(output).toContain('[CONCEPTS]');
    expect(output).toContain('[RECOMMENDED ACTIONS]');
  });

  it('handles every registered simulation id without throwing', () => {
    const ids = [
      'relativity', 'motion', 'gravity', 'bacteria', 'virus', 'immune',
      'heart', 'neural', 'blood', 'stellar', 'uncertainty', 'wave',
      'orbit', 'blackhole', 'chaos', 'probability', 'graph',
      'wave_interference', 'thermodynamics', 'optics', 'electrostatics',
    ];
    for (const id of ids) {
      expect(() =>
        generateLocalSimulationFallback('physics', id, {}, 'provider_error')
      ).not.toThrow();
    }
  });

  it('falls back to the generic explanation for unknown domains', () => {
    const output = generateLocalSimulationFallback('astrology', 'zodiac', {});
    const metadata = parseMetadata(output);
    expect(metadata.source).toBe('deterministic');
    expect(output).not.toContain('[EXPLANATION]\n\n---');
  });
});