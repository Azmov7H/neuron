/**
 * Simulation State Contracts (S-07)
 * Classifies every simulation into an explicit state contract:
 *
 * - `dynamic` (6): the engine mutates real scientific state each frame and
 *   exposes it through `stateSnapshot`:
 *   motion (F=ma kinematics), bacteria (logistic colony growth), virus (SIR
 *   compartments), immune (pathogen/wbc sweep), probability (Galton board
 *   bead settling), graph (force-directed network layout).
 * - `parameterized_visualization` (11): the canvas re-renders a parametric
 *   scientific visualization each frame. There is no measured state — only
 *   the parameter-driven presentation — so telemetry exposes a
 *   `visualizationState` describing the render clock instead of pretending
 *   to measure physics. The set is DERIVED from the registry's interactive
 *   classification: interactive ∩ non-dynamic — there is no second ID list.
 * - `conceptual` (any non-interactive id): no canvas engine; the
 *   ConceptualTelemetryHUD owns the render. Assessment must not present
 *   fabricated measured state for these.
 */

import { INTERACTIVE_SIM_IDS, isInteractiveSim } from '@/lib/simulation/registry';
import type { SimulationStateType } from "./simulation.types";

/**
 * The only simulation-ID list declared for state contracts: the six
 * engines with real measured scientific state. Must be a subset of the
 * registry's interactive list (asserted by tests).
 */
export const DYNAMIC_SIM_IDS = [
  'motion',
  'bacteria',
  'virus',
  'immune',
  'probability',
  'graph',
] as const satisfies ReadonlyArray<string>;

function isDynamicSim(simId: string): boolean {
  return (DYNAMIC_SIM_IDS as readonly string[]).includes(simId);
}

/**
 * State contract classification for a simulation id.
 * Unknown ids (the 31 conceptual HUD simulations) resolve to `conceptual`.
 */
export function getSimulationStateType(simId: string): SimulationStateType {
  if (isDynamicSim(simId)) return 'dynamic';
  if (isInteractiveSim(simId)) return 'parameterized_visualization';
  return 'conceptual';
}

/**
 * Derived lookup map (kept for callers that index by id): every interactive
 * id is classified through the single pipeline above — no literal here can
 * drift from `INTERACTIVE_SIM_IDS`.
 */
export const SIMULATION_STATE_TYPES: Readonly<Record<string, SimulationStateType>> =
  Object.fromEntries(
    INTERACTIVE_SIM_IDS.map((id) => [id, getSimulationStateType(id)])
  );