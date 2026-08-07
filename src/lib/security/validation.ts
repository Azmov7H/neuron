/**
 * Input validation utilities for simulation APIs
 * Zod schemas and validation functions for simulation request bodies
 */

import { z } from 'zod';

// Helper to preprocess domain value to Title Case
const domainPreprocessor = z.preprocess((val) => {
  if (typeof val === 'string') {
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
  }
  return val;
}, z.enum(['Physics', 'Biology', 'Anatomy', 'Mathematics', 'Quantum', 'Space']));

// SimulationRun validation schemas
export const SimulationRunCreateSchema = z.object({
  simulationId: z.string().min(1, 'Simulation ID is required').max(50, 'Simulation ID too long'),
  domain: domainPreprocessor,
  parameters: z.record(z.string(), z.number().finite().min(-1000).max(1000)),
  entities: z.array(z.any()).max(100, 'Too many entities').optional(),
  metrics: z.record(z.string(), z.number().finite().min(0).max(1000000)).optional(),
  userQuestion: z.string().max(500, 'User question too long (max 500 characters)').optional(),
  stateSnapshot: z.record(z.string(), z.any()).optional(),
});

export const SimulationRunUpdateSchema = z.object({
  simulationId: z.string().min(1, 'Simulation ID is required').max(50, 'Simulation ID too long').optional(),
  domain: domainPreprocessor.optional(),
  parameters: z.record(z.string(), z.number().finite().min(-1000).max(1000)).optional(),
  entities: z.array(z.any()).max(100, 'Too many entities').optional(),
  metrics: z.record(z.string(), z.number().finite().min(0).max(1000000)).optional(),
  userQuestion: z.string().max(500, 'User question too long (max 500 characters)').optional(),
  stateSnapshot: z.record(z.string(), z.any()).optional(),
});

/**
 * Validate request body against a schema
 * Returns validated data or throws Zod validation error
 */
export function validateSimulationRun(data: unknown, schema: z.ZodTypeAny): any {
  try {
    return schema.parse(data);
  } catch (error) {
    throw new Error(`Validation failed: ${error instanceof Error ? error.message : 'Invalid input'}`);
  }
}