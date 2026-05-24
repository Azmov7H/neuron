/**
 * Simulation Snapshots Manager
 */

import { SimulationSnapshot, SimulationState } from '../types';

export class SnapshotsManager {
  private snapshots: SimulationSnapshot[] = [];
  private maxHistory: number;

  constructor(maxHistory = 300) {
    this.maxHistory = maxHistory;
  }

  /**
   * Save a copy of the simulation state as a snapshot.
   */
  public record(state: SimulationState) {
    // Deep copy metrics and parameters
    const snapshot: SimulationSnapshot = {
      id: `snap-${Date.now()}-${state.timeStep}`,
      timestamp: Date.now(),
      timeStep: state.timeStep,
      state: {
        timeStep: state.timeStep,
        parameters: { ...state.parameters },
        entities: JSON.parse(JSON.stringify(state.entities)),
        metrics: { ...state.metrics }
      }
    };

    this.snapshots.push(snapshot);

    // Evict oldest if history limit exceeded
    if (this.snapshots.length > this.maxHistory) {
      this.snapshots.shift();
    }
  }

  public getHistory(): SimulationSnapshot[] {
    return this.snapshots;
  }

  public clear() {
    this.snapshots = [];
  }

  /**
   * Retrieve state at a specific historical timestep.
   */
  public getStateAt(timeStep: number): SimulationState | null {
    const found = this.snapshots.find((s) => s.timeStep === timeStep);
    return found ? found.state : null;
  }

  /**
   * Generate a structured textual representation of the simulation telemetry for Spark AI consumption.
   */
  public serializeForAI(conceptTitle: string): string {
    if (this.snapshots.length === 0) {
      return `[Simulation: ${conceptTitle}] No telemetry recorded yet.`;
    }

    const latest = this.snapshots[this.snapshots.length - 1].state;
    const initial = this.snapshots[0].state;

    let summary = `=== SIMULATION TELEMETRY: ${conceptTitle.toUpperCase()} ===\n`;
    summary += `Total Steps: ${latest.timeStep}\n\n`;

    summary += `--- INITIAL PARAMETERS ---\n`;
    for (const [key, val] of Object.entries(initial.parameters)) {
      summary += `${key}: ${val}\n`;
    }
    summary += `\n`;

    summary += `--- LATEST PHYSICAL METRICS ---\n`;
    for (const [key, val] of Object.entries(latest.metrics)) {
      summary += `${key}: ${val.toFixed(4)}\n`;
    }
    summary += `\n`;

    if (latest.entities.length > 0) {
      summary += `--- ACTIVE SYSTEM ENTITIES (Total: ${latest.entities.length}) ---\n`;
      // Describe first 5 entities to avoid overwhelming Spark
      const sample = latest.entities.slice(0, 5);
      sample.forEach((ent, idx) => {
        summary += `Entity [${idx}]: ${JSON.stringify(ent)}\n`;
      });
      if (latest.entities.length > 5) {
        summary += `...and ${latest.entities.length - 5} more entities.\n`;
      }
    }

    return summary;
  }
}
