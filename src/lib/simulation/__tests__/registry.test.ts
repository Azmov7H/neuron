import { describe, it, expect } from 'vitest';
import {
  SIMULATION_REGISTRY,
  DOMAIN_ORDER,
  INTERACTIVE_SIM_IDS,
  getAllSimulations,
  getAllSimulationIds,
  getSimulation,
  isInteractiveSim,
} from '../registry';
import { INTERACTIVE_SIM_IDS as CLIENT_INTERACTIVE_SIM_IDS } from '@/components/simulations/constants';

const ID_PATTERN = /^[a-z_]+$/;

describe('simulation registry integrity', () => {
  it('registers every simulation under a unique domain:id key', () => {
    expect(SIMULATION_REGISTRY.size).toBeGreaterThan(0);
    const keys = Array.from(SIMULATION_REGISTRY.keys());
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('registers exactly 48 simulations, 8 per domain', () => {
    const all = getAllSimulations();
    let total = 0;
    for (const domain of DOMAIN_ORDER) {
      const sims = all[domain];
      expect(sims.length).toBe(8);
      total += sims.length;
    }
    expect(total).toBe(48);
  });

  it('uses valid simulation IDs', () => {
    for (const [, sim] of SIMULATION_REGISTRY) {
      expect(sim.id, sim.id).toMatch(ID_PATTERN);
    }
    expect(new Set(getAllSimulationIds()).size).toBe(getAllSimulationIds().length);
  });

  it('assigns every simulation to a known domain', () => {
    for (const [, sim] of SIMULATION_REGISTRY) {
      expect(DOMAIN_ORDER).toContain(sim.domain);
    }
  });

  it('consistently maps registry keys to their domain:id', () => {
    for (const [key, sim] of SIMULATION_REGISTRY) {
      expect(key).toBe(`${sim.domain}:${sim.id}`);
    }
  });

  it('keeps parameter defaults and specs within bounds', () => {
    for (const [, sim] of SIMULATION_REGISTRY) {
      expect(sim.parameters.length).toBeGreaterThan(0);
      for (const p of sim.parameters) {
        expect(p.min).toBeLessThan(p.max);
        expect(p.step).toBeGreaterThan(0);
        expect(p.default).toBeGreaterThanOrEqual(p.min);
        expect(p.default).toBeLessThanOrEqual(p.max);
        expect(p.required).toBe(true);
      }
    }
  });

  it('looks up simulations regardless of case and rejects unknowns', () => {
    expect(getSimulation('relativity', 'physics')?.id).toBe('relativity');
    expect(getSimulation('RELATIVITY', 'Physics')?.id).toBe('relativity');
    expect(getSimulation('not_a_real_sim', 'physics')).toBeNull();
    expect(getSimulation('relativity', 'biology')).toBeNull();
  });
});

describe('interactive/conceptual classification', () => {
  it('marks a real interactive sim and an unknown sim correctly', () => {
    expect(isInteractiveSim('relativity')).toBe(true);
    expect(isInteractiveSim('pendulum')).toBe(false);
    expect(isInteractiveSim('nonexistent')).toBe(false);
  });

  it('lists exactly 17 interactive sims, all of which exist in the registry', () => {
    expect(INTERACTIVE_SIM_IDS.length).toBe(17);
    expect(new Set(INTERACTIVE_SIM_IDS).size).toBe(17);
    for (const id of INTERACTIVE_SIM_IDS) {
      const found = Array.from(SIMULATION_REGISTRY.values()).find((s) => s.id === id);
      expect(found, `interactive id "${id}" missing from registry`).toBeDefined();
    }
  });

  it('keeps the client constants and the registry classification in sync', () => {
    expect([...CLIENT_INTERACTIVE_SIM_IDS].sort()).toEqual([...INTERACTIVE_SIM_IDS].sort());
  });
});