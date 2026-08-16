import { describe, it, expect } from 'vitest';
import {
  buildParameterSchema,
  checkParameterBounds,
  clampSimulationParameters,
  findMissingRequiredParams,
} from '../schemas';
import { SIMULATION_REGISTRY, getSimulation } from '../registry';

describe('per-simulation parameter schema', () => {
  it('accepts valid in-range parameters', () => {
    const motion = getSimulation('motion', 'physics');
    expect(motion).not.toBeNull();
    const schema = buildParameterSchema(motion!);
    const result = schema.safeParse({ force: 25, mass: 10, friction: 0.3 });
    expect(result.success).toBe(true);
  });

  it('rejects out-of-bound parameters', () => {
    const motion = getSimulation('motion', 'physics');
    const schema = buildParameterSchema(motion!);
    expect(schema.safeParse({ force: 500 }).success).toBe(false);
    expect(schema.safeParse({ force: -5 }).success).toBe(false);
  });

  it('strips unknown parameter keys', () => {
    const motion = getSimulation('motion', 'physics');
    const schema = buildParameterSchema(motion!);
    const result = schema.safeParse({ force: 10, mass: 5, friction: 0.2, bogusKey: 42 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, number>).bogusKey).toBeUndefined();
    }
  });
});

describe('checkParameterBounds', () => {
  it('flags missing required parameters', () => {
    const motion = getSimulation('motion', 'physics');
    const result = checkParameterBounds(motion!, {});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required parameter: force (Thrust Force (N))');
  });

  it('clamps values out of the registry range', () => {
    const motion = getSimulation('motion', 'physics');
    const result = checkParameterBounds(motion!, { force: 999, mass: -3 });
    expect(result.clamped.force).toEqual({ original: 999, clamped: 50 });
    expect(result.clamped.mass).toEqual({ original: -3, clamped: 1 });
  });

  it('rejects non-numeric and non-finite values', () => {
    const motion = getSimulation('motion', 'physics');
    const result = checkParameterBounds(motion!, { force: Number.NaN, mass: 5 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('force'))).toBe(true);
  });

  it('rejects unknown parameters not present in the registry', () => {
    const motion = getSimulation('motion', 'physics');
    const result = checkParameterBounds(motion!, { force: 10, mass: 5, friction: 0.2, power: 9 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Unknown parameter: power'))).toBe(true);
  });

  it('reports partially clamped results as invalid', () => {
    const motion = getSimulation('motion', 'physics');
    const result = checkParameterBounds(motion!, { force: 9, mass: 999 });
    expect(result.valid).toBe(false);
  });
});

describe('findMissingRequiredParams', () => {
  it('lists every absent required parameter', () => {
    const motion = getSimulation('motion', 'physics');
    const missing = findMissingRequiredParams(motion!, {});
    expect(missing.sort()).toEqual(['force', 'friction', 'mass'].sort());
  });

  it('returns an empty list when all required parameters are present', () => {
    const motion = getSimulation('motion', 'physics');
    const missing = findMissingRequiredParams(motion!, { force: 10, mass: 5, friction: 0.2 });
    expect(missing).toEqual([]);
  });
});

describe('registry-wide parameter contract', () => {
  it('every registry parameter default satisfies its own bounds', () => {
    for (const [key, sim] of SIMULATION_REGISTRY) {
      const result = checkParameterBounds(sim, sim.parameters.map((p) => [p.key, p.default]).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}));
      expect(result.valid, `defaults out of bounds for ${key}`).toBe(true);
      expect(result.errors, `defaults invalid for ${key}`).toEqual([]);
    }
  });
});

describe('clampSimulationParameters (VAL-01 / VAL-02 boundary contract)', () => {
  it('returns simulation: null for unknown simulation ids', () => {
    const result = clampSimulationParameters('does-not-exist', 'physics', { force: 1 });
    expect(result.simulation).toBeNull();
  });

  it('returns simulation: null on domain mismatch', () => {
    const result = clampSimulationParameters('motion', 'biology', { force: 1 });
    expect(result.simulation).toBeNull();
  });

  it('clamps out-of-range values into the registry range and reports them', () => {
    const result = clampSimulationParameters('motion', 'physics', {
      force: 999,
      mass: -3,
      friction: 0.2,
    });
    expect(result.simulation).not.toBeNull();
    expect(result.clamped.force).toBe(50); // force max
    expect(result.clamped.mass).toBe(1); // mass min
    expect(result.clamped.friction).toBe(0.2);
    expect(result.changed.sort()).toEqual(['force', 'mass']);
  });

  it('drops unknown keys and non-finite values entirely', () => {
    const result = clampSimulationParameters('motion', 'physics', {
      force: 10,
      mass: 5,
      friction: 0.2,
      bogus: 123,
      velocity: Number.NaN,
      impulse: Number.POSITIVE_INFINITY,
    });
    expect(result.clamped).toEqual({ force: 10, mass: 5, friction: 0.2 });
    expect(result.changed).toEqual([]);
  });

  it('passes valid in-range values through unchanged', () => {
    const result = clampSimulationParameters('motion', 'physics', {
      force: 15,
      mass: 5,
      friction: 0.2,
    });
    expect(result.clamped).toEqual({ force: 15, mass: 5, friction: 0.2 });
    expect(result.changed).toEqual([]);
  });
});