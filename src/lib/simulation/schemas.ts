/**
 * Simulation Configuration Schemas
 * Zod schemas for validating natural-language → SimulationConfig conversions.
 */

import { z } from 'zod';
import type { SimulationDefinition } from './registry.types';
import { SCIENTIFIC_DOMAINS, type ScientificDomain } from './registry.types';
import { getSimulation } from './registry';

// One canonical domain tuple drives every Zod enum — no module may repeat
// the six domain literals.
const DOMAIN_ENUM = z.enum(SCIENTIFIC_DOMAINS);

/**
 * Schema for the request body sent to POST /api/simulations/natural-language
 */
export const NlInterpretationRequestSchema = z.object({
  text: z
    .string()
    .min(1, 'Request text is required')
    .max(500, 'Text too long (max 500 characters)'),
  domainHint: DOMAIN_ENUM.optional(),
});

export type NlInterpretationRequest = z.infer<typeof NlInterpretationRequestSchema>;

/**
 * Schema for the structured JSON the LLM should produce.
 * The LLM is instructed to return { matched: false } if no simulation fits,
 * or { matched: true, domain, simulationId, parameters } if it does.
 */
export const LlmInterpretationOutputSchema = z.object({
  matched: z.boolean(),
  domain: DOMAIN_ENUM.optional(),
  simulationId: z
    .string()
    .regex(/^[a-z_]+$/)
    .optional(),
  parameters: z
    .record(z.string(), z.number().finite())
    .optional(),
});

export type LlmInterpretationOutput = z.infer<typeof LlmInterpretationOutputSchema>;

/**
 * Builds a Zod schema for a specific simulation's parameters from the registry.
 * Each parameter is validated as a finite number within [min, max].
 */
export function buildParameterSchema(sim: SimulationDefinition): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const p of sim.parameters) {
    let s = z.number().finite();
    s = s.min(p.min, `${p.label} must be at least ${p.min}`);
    s = s.max(p.max, `${p.label} must be at most ${p.max}`);
    shape[p.key] = p.required ? s : s.optional();
  }
  return z.object(shape);
}

/**
 * Validates that a parameter value is within the registry-defined bounds
 * for a specific simulation. Returns clamp info if out of range.
 */
export interface BoundCheckResult {
  valid: boolean;
  clamped: Record<string, { original: number; clamped: number }>;
  errors: string[];
}

export function checkParameterBounds(
  sim: SimulationDefinition,
  parameters: Record<string, number>
): BoundCheckResult {
  const errors: string[] = [];
  const clamped: Record<string, { original: number; clamped: number }> = {};

  for (const p of sim.parameters) {
    const value = parameters[p.key];

    if (value === undefined || value === null) {
      if (p.required) {
        errors.push(`Missing required parameter: ${p.key} (${p.label})`);
      }
      continue;
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors.push(`Parameter ${p.key} is not a valid number`);
      continue;
    }

    if (value < p.min) {
      clamped[p.key] = { original: value, clamped: p.min };
    } else if (value > p.max) {
      clamped[p.key] = { original: value, clamped: p.max };
    }
  }

  // Check for unknown parameters (not in registry)
  for (const key of Object.keys(parameters)) {
    const known = sim.parameters.find((p) => p.key === key);
    if (!known) {
      errors.push(`Unknown parameter: ${key} (not supported by this simulation)`);
    }
  }

  return {
    valid: errors.length === 0,
    clamped,
    errors,
  };
}

/**
 * Determines which required parameters are missing from the provided set.
 */
export function findMissingRequiredParams(
  sim: SimulationDefinition,
  parameters: Record<string, number>
): string[] {
  return sim.parameters
    .filter((p) => p.required && (parameters[p.key] === undefined || parameters[p.key] === null))
    .map((p) => p.key);
}

/**
 * Clamps a raw parameter record into the registry-defined range for a given
 * simulation, dropping keys the registry does not declare. Unknown
 * simulation IDs return `simulation: null` so callers can reject them.
 *
 * This is the authoritative sanitization used at external boundaries that
 * accept raw parameter objects (historically: POST /api/simulations/interpret
 * and history restore), so no code path can feed the engine or the AI a
 * value outside the registry ranges (which would produce NaN/Infinity in
 * formulas like motion a=F/m or relativity 1/√(1−v²)).
 */
export function clampSimulationParameters(
  simulationId: string,
  domain: ScientificDomain,
  parameters: Record<string, number>
): { simulation: SimulationDefinition | null; clamped: Record<string, number>; changed: string[] } {
  const sim = getSimulation(simulationId, domain);
  if (!sim) {
    return { simulation: null, clamped: parameters, changed: [] };
  }

  const clamped: Record<string, number> = {};
  const changed: string[] = [];
  for (const p of sim.parameters) {
    const value = parameters[p.key];
    if (value === undefined || value === null) continue;
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    const bounded = Math.max(p.min, Math.min(p.max, value));
    if (bounded !== value) changed.push(p.key);
    clamped[p.key] = bounded;
  }
  return { simulation: sim, clamped, changed };
}
