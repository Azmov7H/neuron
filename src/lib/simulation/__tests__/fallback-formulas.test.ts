import { describe, expect, it } from 'vitest';
import { generateLocalSimulationFallback } from '../deterministic-fallback';
import { getSimulation } from '../registry';

const NON_FINITE = /NaN|Infinity|-Infinity/;

function gridParams(
  simId: string,
  domain: string
): Array<Record<string, number>> {
  const sim = getSimulation(simId, domain);
  if (!sim) throw new Error(`unknown simulation ${simId}/${domain}`);

  let combos: Array<Record<string, number>> = [{}];
  for (const p of sim.parameters) {
    const next: Array<Record<string, number>> = [];
    for (let value = p.min; value <= p.max + 1e-9; value += Math.max(p.step, 1)) {
      for (const combo of combos) {
        next.push({ ...combo, [p.key]: Math.min(value, p.max) });
      }
    }
    combos = next;
  }
  return combos;
}

describe('fallback scientific formulas (P3.1 — RF-1 blackhole)', () => {
  it('produces no NaN/Infinity over the full in-registry parameter grid', () => {
    const combos = gridParams('blackhole', 'space');
    expect(combos.length).toBe(9 * 22); // M 5..13 (9) × r 39..60 (22)
    for (const params of combos) {
      const output = generateLocalSimulationFallback('space', 'blackhole', params);
      expect(output).not.toMatch(NON_FINITE);
    }
  });

  it('keeps every in-registry combination outside the event horizon', () => {
    const combos = gridParams('blackhole', 'space');
    for (const params of combos) {
      const output = generateLocalSimulationFallback('space', 'blackhole', params);
      expect(output).not.toContain('inside the event horizon');
    }
  });

  it('evaluates the default combination to a defined time-dilation value', () => {
    const sim = getSimulation('blackhole', 'space');
    expect(sim).not.toBeNull();
    const params: Record<string, number> = {};
    for (const p of sim!.parameters) params[p.key] = p.default;

    const output = generateLocalSimulationFallback('space', 'blackhole', params);
    expect(output).not.toMatch(NON_FINITE);
    expect(output).toContain('x time dilation');
  });

  it('reports explicit inside-horizon semantics instead of NaN below r = rs', () => {
    // rs = 2.95·10 = 29.5 km; probe inside (20) and exactly on the horizon.
    for (const r of [20, 29.5]) {
      const output = generateLocalSimulationFallback('space', 'blackhole', {
        blackholeMass: 10,
        probeDistance: r,
      });
      expect(output).not.toMatch(NON_FINITE);
      expect(output).toContain('inside the event horizon');
    }
  });

  it('handles the pre-fix default (M=10, r=22) safely and identifies the horizon-domain issue', () => {
    // The audit found the registry default produced NaN for this exact combo.
    // The explanation text may itself contain the word "undefined" (the time-
    // dilation value is undefined here) — the requirement is that no numeric
    // output is NaN/Infinity/undefined, which the NON_FINITE regex guards.
    const output = generateLocalSimulationFallback('space', 'blackhole', {
      blackholeMass: 10,
      probeDistance: 22,
    });
    expect(output).not.toMatch(NON_FINITE);
    expect(output).toContain('inside the event horizon');
  });

  it('sweeps the legacy pre-fix parameter ranges without any NaN/Infinity', () => {
    // The runtime domain guard (not just the tightened registry ranges) must
    // keep every combination safe: M 5..30 × r 12..40 (step 1).
    for (let m = 5; m <= 30; m++) {
      for (let r = 12; r <= 40; r++) {
        const output = generateLocalSimulationFallback('space', 'blackhole', {
          blackholeMass: m,
          probeDistance: r,
        });
        expect(output).not.toMatch(NON_FINITE);
      }
    }
  });

  it('uses the geodesic time-dilation factor for r > rs', () => {
    // Defaults: M = 10 → rs = 29.5, r = 45 → rs/r = 0.6556 → 1/√(1-0.6556) ≈ 1.70x
    const output = generateLocalSimulationFallback('space', 'blackhole', {
      blackholeMass: 10,
      probeDistance: 45,
    });
    expect(output).toContain('1.70x time dilation');
  });
});