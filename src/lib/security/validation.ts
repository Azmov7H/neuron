/**
 * Input validation utilities for simulation APIs
 * Zod schemas and validation functions for simulation request bodies.
 * The domain set is derived from the canonical `SCIENTIFIC_DOMAINS`
 * enumeration — no independent domain list exists here.
 */

import { z } from 'zod';
import { SCIENTIFIC_DOMAINS } from '@/lib/simulation/registry.types';

// Wire/storage convention: domains are persisted Title-Cased (legacy
// behavior — changing it would break existing rows). The allowed set is
// derived from the canonical lowercase enumeration and normalized at this
// untrusted-input boundary only.
const SCIENTIFIC_TITLE_CASE_DOMAINS = [...SCIENTIFIC_DOMAINS].map(
  (domain) => domain.charAt(0).toUpperCase() + domain.slice(1)
) as [string, ...string[]];

const domainPreprocessor = z.preprocess((val) => {
  if (typeof val === 'string') {
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
  }
  return val;
}, z.enum(SCIENTIFIC_TITLE_CASE_DOMAINS));

// SimulationRun validation schemas
export const SimulationRunCreateSchema = z.object({
  simulationId: z.string().min(1, 'Simulation ID is required').max(50, 'Simulation ID too long'),
  domain: domainPreprocessor,
  parameters: z.record(z.string(), z.number().finite().min(-1000).max(1000)),
  // `entities` is genuinely dynamic runtime data (entity shape varies per
  // simulation) — validated as an array at the boundary; internal callers
  // narrow it immediately after validation.
  entities: z.array(z.any()).max(100, 'Too many entities').optional(),
  metrics: z.record(z.string(), z.number().finite().min(0).max(1000000)).optional(),
  userQuestion: z.string().max(500, 'User question too long (max 500 characters)').optional(),
  // Arbitrary JSON snapshot — validated as a string-keyed object at the
  // boundary; the engine-typed snapshot contract is internal-only.
  stateSnapshot: z.record(z.string(), z.unknown()).optional(),
  // P1 state contract: how the assessment should interpret the snapshot
  stateType: z.enum(['dynamic', 'parameterized_visualization', 'conceptual']).optional(),
  simulationTime: z.number().finite().min(0).max(86400).optional(),
});

export const SimulationRunUpdateSchema = z.object({
  simulationId: z.string().min(1, 'Simulation ID is required').max(50, 'Simulation ID too long').optional(),
  domain: domainPreprocessor.optional(),
  parameters: z.record(z.string(), z.number().finite().min(-1000).max(1000)).optional(),
  entities: z.array(z.any()).max(100, 'Too many entities').optional(),
  metrics: z.record(z.string(), z.number().finite().min(0).max(1000000)).optional(),
  userQuestion: z.string().max(500, 'User question too long (max 500 characters)').optional(),
  stateSnapshot: z.record(z.string(), z.unknown()).optional(),
  stateType: z.enum(['dynamic', 'parameterized_visualization', 'conceptual']).optional(),
  simulationTime: z.number().finite().min(0).max(86400).optional(),
});

/**
 * Validate request body against a schema
 * Returns the schema's parsed output type or throws on invalid input.
 */
export function validateSimulationRun<T>(data: unknown, schema: z.ZodType<T>): T {
  try {
    return schema.parse(data);
  } catch (error) {
    throw new Error(`Validation failed: ${error instanceof Error ? error.message : 'Invalid input'}`);
  }
}