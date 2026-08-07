/**
 * Simulation Domain Types
 * Centralized type definitions for simulation module
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Scientific domains supported by the simulation system
 */
export type ScientificDomain = 'physics' | 'biology' | 'anatomy' | 'mathematics' | 'quantum' | 'space';

/**
 * Parameter specification for a configurable simulation parameter
 */
export interface SimulationParameter {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
}

/**
 * Core simulation definition with executable logic and configuration
 */
export interface Simulation {
  id: string;
  name: string;
  desc: string;
  equation: string;
  defaultParams: Record<string, number>;
  paramsList: SimulationParameter[];
}

/**
 * Domain configuration grouping related simulations
 */
export interface SimulationDomain {
  name: string;
  icon: LucideIcon;
  colorClass: string;
  glowClass: string;
  accentHex: string;
  simulations: Simulation[];
}

/**
 * Telemetry snapshot from the simulation engine
 */
export interface TelemetrySnapshot {
  timeStep: number;
  stateSnapshot: Record<string, unknown>;
}

/**
 * Historical simulation run record
 */
export interface SimulationHistory {
  _id: string;
  timestamp: string;
  parameters: Record<string, number>;
  aiInterpretation: {
    explanation: string;
    keyInsights: string[];
    concepts: string[];
    recommendedActions: string[];
  };
}

/**
 * Telemetry callback for engine state synchronization
 */
export type TelemetrySyncCallback = (snap: TelemetrySnapshot) => void;

/**
 * Engine lifecycle state
 */
export enum EngineState {
  Idle = 'idle',
  Running = 'running',
  Paused = 'paused',
  Stopped = 'stopped',
}

/**
 * SIR model particle state
 */
export type SIRParticleState = 'S' | 'I' | 'R';

/**
 * SIR model particle for epidemiology simulations
 */
export interface SIRParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: SIRParticleState;
  timer: number;
}

/**
 * Generic particle entity for simulations
 */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * Settled bead for probability simulations
 */
export interface BeadParticle extends Particle {
  settled: boolean;
  bin?: number;
}

/**
 * AI interpretation result for simulation analysis
 */
export interface AIInterpretation {
  explanation: string;
  keyInsights: string[];
  concepts: string[];
  recommendedActions: string[];
  metadata?: {
    domain: string;
    simulationType: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    aiModel: string;
  };
}

/**
 * Configuration for a specific interactive simulation
 */
export interface InteractiveSimulationConfig {
  domain: ScientificDomain;
  simulationId: string;
  parameters: Record<string, number>;
  stateSnapshot?: Record<string, unknown>;
}
