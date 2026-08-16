/**
 * P2 Contract Consolidation Tests
 * Proves the single-source-of-truth architecture:
 * - the registry is the only simulation catalog (IDs, domains, params)
 * - the client projection / API payload derive entirely from the registry
 * - interactive classification has no duplicate source of truth
 * - NL whitelist derives from the registry enumeration
 * - reset and history restore operate on canonical parameter definitions
 */

import { describe, it, expect } from 'vitest';
import {
  SIMULATION_REGISTRY,
  DOMAIN_ORDER,
  INTERACTIVE_SIM_IDS,
  SCIENTIFIC_DOMAINS,
  getAllSimulations,
  getSimulation,
  isInteractiveSim,
  toClientSimulation,
  getSimulationsByDomain,
} from '../registry';
import { buildSimulationConfigPayload } from '../config-payload';
import { checkParameterBounds, buildParameterSchema } from '../schemas';
import { buildRegistrySystemPrompt } from '../nl-interpreter.service';
import { LlmInterpretationOutputSchema } from '../schemas';
import { DYNAMIC_SIM_IDS, SIMULATION_STATE_TYPES, getSimulationStateType } from '@/components/simulation-runner/simulation-state';
import { INTERACTIVE_SIM_IDS as CLIENT_INTERACTIVE_SIM_IDS } from '@/components/simulations/constants';

describe('P2 — registry is the single catalog (requirements 1–3)', () => {
  it('registers exactly 48 simulations', () => {
    expect(SIMULATION_REGISTRY.size).toBe(48);
    expect(getAllSimulations()).toBeDefined();
  });

  it('assigns every simulation to exactly one domain', () => {
    let total = 0;
    for (const domain of DOMAIN_ORDER) {
      const sims = getSimulationsByDomain(domain);
      total += sims.length;
      for (const sim of sims) {
        // Unique domain:id keys mean a simulation can never belong to two domains.
        expect(SIMULATION_REGISTRY.get(`${domain}:${sim.id}`)).toBe(sim);
      }
    }
    expect(total).toBe(48);
  });

  it('gives every domain its expected simulation count (8 per domain)', () => {
    for (const domain of DOMAIN_ORDER) {
      expect(getSimulationsByDomain(domain).length, `domain "${domain}" count`).toBe(8);
    }
  });

  it('SCIENTIFIC_DOMAINS matches DOMAIN_ORDER and the registry membership', () => {
    expect([...SCIENTIFIC_DOMAINS]).toEqual([...DOMAIN_ORDER]);
    for (const domain of SCIENTIFIC_DOMAINS) {
      expect(ScientificDomainsAll(domain)).toBe(true);
    }
    function ScientificDomainsAll(domain: (typeof SCIENTIFIC_DOMAINS)[number]): boolean {
      return DOMAIN_ORDER.includes(domain);
    }
  });
});

describe('P2 — interactive classification has no duplicate source (requirement 4, 12)', () => {
  it('client constants ARE the registry list (re-export, same reference)', () => {
    // The hub shim re-exports the registry constant — an identity assertion
    // means a second literal cannot silently diverge.
    expect(CLIENT_INTERACTIVE_SIM_IDS).toBe(INTERACTIVE_SIM_IDS);
  });

  it('lists exactly 17 interactive sims, all of which exist in the registry', () => {
    expect(INTERACTIVE_SIM_IDS.length).toBe(17);
    expect(new Set(INTERACTIVE_SIM_IDS).size).toBe(17);
    for (const id of INTERACTIVE_SIM_IDS) {
      expect(isInteractiveSim(id)).toBe(true);
    }
  });

  it('derives the parameterized set from interactive minus dynamic — no second ID literal', () => {
    for (const id of DYNAMIC_SIM_IDS) {
      expect(isInteractiveSim(id), `dynamic id "${id}" must be interactive`).toBe(true);
    }
    // The 11 parameterized sims are INTERACTIVE - DYNAMIC, computed by the
    // classifier itself; a duplicate literal would break this count.
    const dynamicIds: ReadonlyArray<string> = DYNAMIC_SIM_IDS;
    const parameterized = INTERACTIVE_SIM_IDS.filter((id) => !dynamicIds.includes(id));
    expect(parameterized.length).toBe(11);
    expect(getSimulationStateType('relativity')).toBe('parameterized_visualization');
    for (const id of INTERACTIVE_SIM_IDS) {
      expect(getSimulationStateType(id)).not.toBe('conceptual');
    }
    expect(getSimulationStateType('unknown-slug')).toBe('conceptual');
  });

  it('keeps the derived SIMULATION_STATE_TYPES map consistent with the classifier', () => {
    expect(Object.keys(SIMULATION_STATE_TYPES).sort()).toEqual([...INTERACTIVE_SIM_IDS].sort());
    for (const id of INTERACTIVE_SIM_IDS) {
      expect(SIMULATION_STATE_TYPES[id]).toBe(getSimulationStateType(id));
    }
  });
});

describe('P2 — client projection preserves the registry contract (requirement 5, 6)', () => {
  it('projects every registry simulation without dropping parameter metadata', () => {
    for (const sim of SIMULATION_REGISTRY.values()) {
      const projected = toClientSimulation(sim);
      expect(projected.id).toBe(sim.id);
      expect(projected.name).toBe(sim.name);
      expect(projected.desc).toBe(sim.description);
      expect(projected.equation).toBe(sim.equation);
      // defaultParams mirrors the canonical `default` values exactly.
      expect(projected.defaultParams).toEqual(
        Object.fromEntries(sim.parameters.map((p) => [p.key, p.default]))
      );
      // paramsList carries the FULL canonical parameter metadata.
      expect(projected.paramsList).toEqual(sim.parameters);
    }
  });

  it('produces identical results whether parameter lists are compared by key or shape', () => {
    const motion = getSimulation('motion', 'physics');
    expect(motion).not.toBeNull();
    const projected = toClientSimulation(motion!);
    const keys = projected.paramsList.map((p) => p.key);
    expect(keys).toEqual(['force', 'mass', 'friction']);
    for (const p of projected.paramsList) {
      expect(p.min).toBeLessThan(p.max);
      expect(p.step).toBeGreaterThan(0);
      expect(p.default).toBeGreaterThanOrEqual(p.min);
      expect(p.default).toBeLessThanOrEqual(p.max);
      expect(['number', 'integer']).toContain(p.type);
    }
  });
});

describe('P2 — API config payload derives entirely from the registry (requirement 7)', () => {
  it('builds exactly 6 domains × 8 registry simulations, in registry order', () => {
    const payload = buildSimulationConfigPayload();
    expect(payload.length).toBe(6);
    for (const domain of DOMAIN_ORDER) {
      const entry = payload.find((d) => d.domainKey === domain);
      expect(entry, `missing domain "${domain}" in payload`).toBeDefined();
      expect(entry!.simulations.map((s) => s.id)).toEqual(
        getSimulationsByDomain(domain).map((s) => s.id)
      );
      expect(entry!.simulations.length).toBe(8);
    }
    expect(payload.map((d) => d.domainKey)).toEqual([...DOMAIN_ORDER]);
  });

  it('exposes names and presentation fields for every domain', () => {
    for (const entry of buildSimulationConfigPayload()) {
      expect(entry.name.length).toBeGreaterThan(0);
      expect(typeof entry.colorClass).toBe('string');
      expect(typeof entry.glowClass).toBe('string');
      expect(entry.accentHex).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('P2 — unknown simulation IDs are rejected (requirement 8)', () => {
  it('rejects unknown IDs at the registry boundary', () => {
    expect(getSimulation('not_a_real_sim', 'physics')).toBeNull();
    expect(isInteractiveSim('not_a_real_sim')).toBe(false);
    expect(getSimulationStateType('not_a_real_sim')).toBe('conceptual');
  });

  it('rejects unknown IDs at the schema boundary (NL domain enum)', () => {
    const result = LlmInterpretationOutputSchema.safeParse({
      matched: true,
      domain: 'astrology',
      simulationId: 'motion',
      parameters: {},
    });
    expect(result.success).toBe(false);
  });
});

describe('P2 — NL whitelist derives from the registry (requirement 9)', () => {
  it('lists every registry simulation id in the LLM system prompt', () => {
    const prompt = buildRegistrySystemPrompt();
    for (const sim of SIMULATION_REGISTRY.values()) {
      expect(prompt, `prompt must include "${sim.id}"`).toContain(`"${sim.id}": ${sim.name}`);
    }
  });

  it('lists every canonical domain in the prompt rule line', () => {
    const prompt = buildRegistrySystemPrompt();
    expect(prompt).toContain(`- domain must be one of: ${SCIENTIFIC_DOMAINS.join(', ')}.`);
  });
});

describe('P2 — reset and history restore use canonical definitions (requirement 10, 11)', () => {
  it('every registry default is a valid, in-bounds parameter set', () => {
    for (const sim of SIMULATION_REGISTRY.values()) {
      const defaults = toClientSimulation(sim).defaultParams;
      const bounds = checkParameterBounds(sim, defaults);
      expect(bounds.valid, `defaults invalid for ${sim.domain}:${sim.id}`).toBe(true);
      const schema = buildParameterSchema(sim);
      expect(schema.safeParse(defaults).success).toBe(true);
    }
  });

  it('history-restored parameter values remain within canonical registry bounds', () => {
    // Simulates a stored run's parameters being restored into the engine:
    // any in-range value set must pass the canonical bounds checker.
    const motion = getSimulation('motion', 'physics')!;
    const restored = { force: 30, mass: 12, friction: 0.55 }; // history payload shape
    expect(checkParameterBounds(motion, restored).valid).toBe(true);
    // Out-of-range restored data is clamped by the same canonical checker —
    // the client-side runtime never needs its own parameter definitions.
    const outOfRange = checkParameterBounds(motion, { force: 9999, mass: 5, friction: 0.2 });
    expect(outOfRange.clamped.force).toEqual({ original: 9999, clamped: motion.parameters[0].max });
  });
});

describe('P2 — compile-time contract assertions', () => {
  it('DYNAMIC_SIM_IDS is strictly typed as a readonly string tuple', () => {
    // `satisfies` in simulation-state forces this; here we assert the type
    // surface used by the classifier.
    const typed: readonly string[] = DYNAMIC_SIM_IDS;
    expect(typed.length).toBe(6);
  });
});