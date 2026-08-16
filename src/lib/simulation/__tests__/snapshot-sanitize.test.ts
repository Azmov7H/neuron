import { describe, it, expect } from 'vitest';
import { sanitizeSnapshot } from '../snapshot-sanitize';

describe('sanitizeSnapshot (EDGE-06 / ASSESS-02 shared boundary)', () => {
  it('strips NaN and ±Infinity at the top level', () => {
    const clean = sanitizeSnapshot({
      timeStep: 0,
      velocity: Number.NaN,
      acceleration: Number.POSITIVE_INFINITY,
      ratio: Number.NEGATIVE_INFINITY,
    });
    expect(clean).toEqual({ timeStep: 0 });
  });

  it('recurses into nested objects but leaves arrays and scalars untouched', () => {
    const clean = sanitizeSnapshot({
      nested: { population: 12, ratio: Number.NaN, ok: 3.5 },
      list: [1, Number.NaN],
      label: 'moving',
      flag: true,
      nothing: null,
    });
    expect(clean).toEqual({
      nested: { population: 12, ok: 3.5 },
      list: [1, Number.NaN],
      label: 'moving',
      flag: true,
      nothing: null,
    });
  });

  it('handles deep nesting without throwing', () => {
    const dirty: Record<string, unknown> = {};
    let cursor = dirty;
    for (let i = 0; i < 100; i++) {
      cursor.child = { deep: i, bad: Number.POSITIVE_INFINITY };
      cursor = cursor.child as Record<string, unknown>;
    }
    const clean = sanitizeSnapshot(dirty);
    expect(JSON.stringify(clean)).not.toContain('Infinity');
    expect(JSON.parse(JSON.stringify(clean))).toEqual(clean);
  });

  it('is JSON-safe: sanitized output round-trips without lossy coercion', () => {
    const clean = sanitizeSnapshot({
      velocity: 0.0312,
      nested: { k: 0, ok: 12 },
    });
    expect(JSON.parse(JSON.stringify(clean))).toEqual(clean);
  });
});