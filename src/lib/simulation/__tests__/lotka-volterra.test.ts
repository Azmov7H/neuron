import { describe, expect, it } from 'vitest';
import {
  integrateLotkaVolterra,
  LOTKA_VOLTERRA_COEFFICIENTS,
  LOTKA_VOLTERRA_EQUILIBRIUM,
} from '../lotka-volterra';
import { getSimulation } from '../registry';

describe('Lotka–Volterra integrator (P3.1 — RF-3 ecosystem)', () => {
  it('produces bounded, finite, positive populations over a long horizon', () => {
    const samples = integrateLotkaVolterra(60, 15, 50, 200);
    expect(samples.length).toBeGreaterThan(100);
    for (const s of samples) {
      expect(Number.isFinite(s.prey)).toBe(true);
      expect(Number.isFinite(s.predators)).toBe(true);
      expect(s.prey).toBeGreaterThan(0);
      expect(s.predators).toBeGreaterThan(0);
      expect(s.prey).toBeLessThan(500);
      expect(s.predators).toBeLessThan(500);
    }
  });

  it('oscillates with the predator peak lagging the prey peak', () => {
    const samples = integrateLotkaVolterra(60, 15, 50, 200);
    const preyVals = samples.map((s) => s.prey);
    const predVals = samples.map((s) => s.predators);
    const preyPeak = preyVals.indexOf(Math.max(...preyVals));
    const predPeak = predVals.indexOf(Math.max(...predVals));
    expect(preyVals.length).toBeGreaterThan(2);
    expect(predVals.length).toBeGreaterThan(2);
    expect(preyPeak).toBeGreaterThan(0);
    expect(predPeak).toBeGreaterThan(preyPeak);
    expect(predPeak - preyPeak).toBeGreaterThan(5);
  });

  it('holds the equilibrium point exactly constant', () => {
    const { prey, predators } = LOTKA_VOLTERRA_EQUILIBRIUM;
    const samples = integrateLotkaVolterra(prey, predators, 50, 100);
    for (const s of samples) {
      expect(Math.abs(s.prey - prey)).toBeLessThan(1e-6);
      expect(Math.abs(s.predators - predators)).toBeLessThan(1e-6);
    }
  });

  it('has an equilibrium inside the registry parameter ranges', () => {
    const { alpha, beta, delta, gamma } = LOTKA_VOLTERRA_COEFFICIENTS;
    expect(LOTKA_VOLTERRA_EQUILIBRIUM.prey).toBeCloseTo(gamma / delta, 6);
    expect(LOTKA_VOLTERRA_EQUILIBRIUM.predators).toBeCloseTo(alpha / beta, 6);
    expect(LOTKA_VOLTERRA_EQUILIBRIUM.prey).toBeGreaterThan(20);
    expect(LOTKA_VOLTERRA_EQUILIBRIUM.prey).toBeLessThan(100);
    expect(LOTKA_VOLTERRA_EQUILIBRIUM.predators).toBeGreaterThan(5);
    expect(LOTKA_VOLTERRA_EQUILIBRIUM.predators).toBeLessThan(35);
  });

  it('starts from the registry default initial conditions (prey 60, predators 15)', () => {
    const sim = getSimulation('ecosystem', 'biology');
    expect(sim).not.toBeNull();
    const byKey = new Map(sim!.parameters.map((p) => [p.key, p.default]));
    expect(byKey.get('preyPopulation')).toBe(60);
    expect(byKey.get('predatorPopulation')).toBe(15);

    const samples = integrateLotkaVolterra(60, 15, 50, 100);
    expect(samples[0]).toEqual({ prey: 60, predators: 15 });
  });

  it('couples the two populations: prey collapse starves predators, predator presence suppresses prey growth', () => {
    // No prey (x = 0): dx/dt = 0 and dy/dt = −γy → predators decay monotonically.
    const starved = integrateLotkaVolterra(0, 15, 20, 80);
    for (const s of starved) {
      expect(s.prey).toBe(0);
      expect(s.predators).toBeGreaterThanOrEqual(0);
    }
    expect(starved[starved.length - 1].predators).toBeLessThan(starved[0].predators);

    // Predators suppress prey growth: with predators present, prey at 1 grows
    // ~11× slower than with no predators (both start from the same prey count).
    const withPredators = integrateLotkaVolterra(1, 25, 20, 80);
    const withoutPredators = integrateLotkaVolterra(1, 0, 20, 80);
    const finalWith = withPredators[withPredators.length - 1].prey;
    const finalWithout = withoutPredators[withoutPredators.length - 1].prey;
    expect(finalWithout).toBeGreaterThan(finalWith * 5);
    expect(finalWithout).toBeGreaterThan(100);
  });

  it('is sensitive to the initial populations: different prey starts shift the predator trajectory', () => {
    const low = integrateLotkaVolterra(40, 15, 50, 200).map((s) => s.predators);
    const high = integrateLotkaVolterra(80, 15, 50, 200).map((s) => s.predators);
    expect(Math.max(...low)).toBeGreaterThan(15);
    expect(Math.max(...high)).toBeGreaterThan(15);
    expect(Math.max(...high)).not.toBeCloseTo(Math.max(...low), 3);

    const predatorsLow = integrateLotkaVolterra(60, 10, 50, 200).map((s) => s.prey);
    const predatorsHigh = integrateLotkaVolterra(60, 30, 50, 200).map((s) => s.prey);
    expect(Math.max(...predatorsHigh)).not.toBeCloseTo(Math.max(...predatorsLow), 3);
  });
});