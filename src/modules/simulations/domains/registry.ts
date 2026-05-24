/**
 * Simulation Plugin Registry
 */

import { ISimulationPlugin } from '../types';

export class SimulationPluginRegistry {
  private static instance: SimulationPluginRegistry | null = null;
  private plugins: Map<string, ISimulationPlugin> = new Map();

  private constructor() {}

  public static getInstance(): SimulationPluginRegistry {
    if (!this.instance) {
      this.instance = new SimulationPluginRegistry();
    }
    return this.instance;
  }

  /**
   * Register a new scientific simulation domain plugin
   */
  public register(plugin: ISimulationPlugin) {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[SimulationRegistry] Overwriting plugin with ID "${plugin.id}"`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  /**
   * Fetch a registered plugin by ID
   */
  public get(id: string): ISimulationPlugin | null {
    return this.plugins.get(id) || null;
  }

  public getAll(): ISimulationPlugin[] {
    return Array.from(this.plugins.values());
  }

  public clear() {
    this.plugins.clear();
  }
}
