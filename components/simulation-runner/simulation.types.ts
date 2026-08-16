/**
 * Simulation Runner Types
 * Engine-and-runner-local type definitions.
 *
 * `ScientificDomain` and `SimulationParameter` are NOT declared here — they
 * live in the canonical definition `src/lib/simulation/registry.types.ts` and
 * every consumer imports them from there directly.
 */

/**
 * State contract classification for a simulation run.
 *
 * - `dynamic`: the engine holds real measured/mutable scientific state that
 *   advances over time (population counts, velocities, SIR compartments).
 * - `parameterized_visualization`: the visualization is a parameter-driven
 *   render; there is no measured scientific state, only presentation state.
 * - `conceptual`: no 60 FPS canvas engine; the HUD renders a conceptual
 *   parameter-driven visualization. No dynamic state exists.
 */
export type SimulationStateType = 'dynamic' | 'parameterized_visualization' | 'conceptual';

/**
 * Telemetry snapshot from the simulation engine
 */
export interface TelemetrySnapshot {
  /** Frame/step counter (1 per executed physics frame) */
  timeStep: number;
  /** Physical simulation clock in seconds (frame-rate independent) */
  simulationTime: number;
  /** State contract classification of this simulation */
  stateType: SimulationStateType;
  stateSnapshot: Record<string, unknown>;
}