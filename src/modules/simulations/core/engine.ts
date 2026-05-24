/**
 * Simulation Core Engine Class
 */

import { ISimulationPlugin, SimulationState, SimulationLifecycleEvent, SimulationEventCallback } from '../types';

export class SimulationEngine {
  private plugin: ISimulationPlugin;
  private state: SimulationState;
  
  private isRunning = false;
  private animationFrameId: number | null = null;
  private lastTimestamp = 0;
  
  private callbacks: Set<SimulationEventCallback> = new Set();

  constructor(plugin: ISimulationPlugin, initialParameters: Record<string, number>) {
    this.plugin = plugin;
    this.state = this.plugin.initialize(initialParameters);
    this.emit('init');
  }

  /**
   * Start the simulation execution loop
   */
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.emit('start');
    this.tick(this.lastTimestamp);
  }

  /**
   * Pause the simulation
   */
  public pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.emit('pause');
  }

  /**
   * Resume simulation
   */
  public resume() {
    this.start();
  }

  /**
   * Reset simulation to original parameters
   */
  public reset(parameters?: Record<string, number>) {
    const wasRunning = this.isRunning;
    this.pause();
    
    const params = parameters || this.state.parameters;
    this.state = this.plugin.reset(params);
    this.emit('reset');
    
    if (wasRunning) {
      this.start();
    }
  }

  /**
   * Clean up and destroy the running engine
   */
  public destroy() {
    this.pause();
    this.emit('destroy');
    this.callbacks.clear();
  }

  public getState(): SimulationState {
    // Return a shallow copy of the state structure to maintain safety
    return { ...this.state };
  }

  public getPluginMetadata(): Record<string, any> {
    return this.plugin.getVisualizationMetadata(this.state);
  }

  /**
   * Subscribe to lifecycle and tick update events
   */
  public subscribe(callback: SimulationEventCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * The animation tick loop
   */
  private tick(timestamp: number) {
    if (!this.isRunning) return;

    // Calculate elapsed time (cap at 100ms to prevent huge jumps on background tabs)
    const elapsed = Math.min(100, timestamp - this.lastTimestamp);
    const deltaTime = elapsed / 1000.0; // convert to seconds
    this.lastTimestamp = timestamp;

    // Perform physics/rule state update
    this.state = this.plugin.update(this.state, deltaTime);
    this.state.timeStep += 1;

    this.emit('update');

    this.animationFrameId = requestAnimationFrame((t) => this.tick(t));
  }

  /**
   * Emit events to subscribers
   */
  private emit(event: SimulationLifecycleEvent) {
    for (const callback of this.callbacks) {
      try {
        callback(event, this.state);
      } catch (err) {
        console.error(`[SimulationEngine] Callback error in event "${event}":`, err);
      }
    }
  }
}
