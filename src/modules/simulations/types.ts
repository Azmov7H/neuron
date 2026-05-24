/**
 * Scientific Simulation Core Types
 */

export interface SimulationState {
  timeStep: number;
  parameters: Record<string, number>;
  entities: any[];
  metrics: Record<string, number>;
}

export interface SimulationSnapshot {
  id: string;
  timestamp: number;
  timeStep: number;
  state: SimulationState;
}

export interface ISimulationPlugin {
  id: string;
  name: string;
  domain: 'Physics' | 'Biology' | 'Anatomy' | 'Mathematics' | 'Quantum' | 'Space';
  
  /**
   * Initializes the state of the simulation with parameters.
   */
  initialize(parameters: Record<string, number>): SimulationState;

  /**
   * Performs a deterministic state update step given the deltaTime.
   */
  update(state: SimulationState, deltaTime: number): SimulationState;

  /**
   * Reset simulation state.
   */
  reset(parameters: Record<string, number>): SimulationState;

  /**
   * Metadata needed for 2D/3D visualizers.
   */
  getVisualizationMetadata(state: SimulationState): Record<string, any>;
}

export type SimulationLifecycleEvent = 'init' | 'start' | 'pause' | 'resume' | 'reset' | 'update' | 'destroy';

export type SimulationEventCallback = (event: SimulationLifecycleEvent, state: SimulationState) => void;
