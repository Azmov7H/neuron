/**
 * Simulation Registry Types
 * Centralized type definitions for the simulation registry — the single
 * source of truth for all simulation domains, IDs, and parameter specs.
 *
 * `SCIENTIFIC_DOMAINS` is the ONLY enumeration of domain membership; every
 * other module (schemas, validation, hub components, NL interpreter, tests)
 * derives its domain set from this tuple. Do not re-declare domain literals
 * anywhere else.
 */

export const SCIENTIFIC_DOMAINS = [
  'physics',
  'biology',
  'anatomy',
  'mathematics',
  'quantum',
  'space',
] as const;

export type ScientificDomain = (typeof SCIENTIFIC_DOMAINS)[number];

export type ParameterType = 'number' | 'integer';

/**
 * Canonical parameter specification. Every layer — client projection,
 * runtime parameter state, engine input, NL pipeline — uses this exact
 * shape. No separately declared parameter contracts exist.
 */
export interface SimulationParameter {
  key: string;
  label: string;
  description?: string;
  unit?: string;
  type: ParameterType;
  min: number;
  max: number;
  step: number;
  default: number;
  required: boolean;
}

export interface SimulationDefinition {
  id: string;
  name: string;
  description: string;
  domain: ScientificDomain;
  equation: string;
  parameters: SimulationParameter[];
}

/**
 * Client-safe projection of a SimulationDefinition (produced by
 * `toClientSimulation`). `desc` is the wire/legacy field name for
 * `description`; `paramsList` carries the FULL canonical parameter metadata
 * so no important fields are lost at the client boundary.
 */
export interface ClientSimulation {
  id: string;
  name: string;
  desc: string;
  equation: string;
  defaultParams: Record<string, number>;
  paramsList: SimulationParameter[];
}