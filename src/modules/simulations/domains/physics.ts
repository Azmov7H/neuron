/**
 * Physics Domain Plugin
 */

import { ISimulationPlugin, SimulationState } from '../types';

export class PhysicsPlugin implements ISimulationPlugin {
  public id = 'physics-engine';
  public name = 'Newtonian & Relativity Simulator';
  public domain = 'Physics' as const;

  public initialize(parameters: Record<string, number>): SimulationState {
    const mass = parameters.mass ?? 10.0;
    const velocity = parameters.velocity ?? 50.0;
    const gravity = parameters.gravity ?? 9.81;

    return {
      timeStep: 0,
      parameters: { mass, velocity, gravity },
      entities: [
        { id: 'particle-0', x: 0, y: 100, vx: velocity * 0.8, vy: -velocity * 0.5, mass }
      ],
      metrics: {
        kineticEnergy: 0.5 * mass * velocity * velocity,
        potentialEnergy: mass * gravity * 100,
        totalEnergy: 0.5 * mass * velocity * velocity + mass * gravity * 100,
        lorentzFactor: 1.0
      }
    };
  }

  public update(state: SimulationState, deltaTime: number): SimulationState {
    const { gravity, mass } = state.parameters;
    const entities = state.entities.map((ent) => {
      // Newtonian updates
      let x = ent.x + ent.vx * deltaTime;
      let y = ent.y + ent.vy * deltaTime;

      // Apply gravity to Y velocity
      let vy = ent.vy + gravity * deltaTime;
      let vx = ent.vx;

      // Boundaries collision with elastic bounce
      if (y > 400) {
        y = 400;
        vy = -vy * 0.8; // bounce energy loss
      }
      if (x > 700 || x < 0) {
        vx = -vx;
      }

      return { ...ent, x, y, vx, vy };
    });

    // Calculate metrics
    const p = entities[0];
    const velocityMagnitude = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    const kineticEnergy = 0.5 * mass * velocityMagnitude * velocityMagnitude;
    const potentialEnergy = mass * gravity * (400 - p.y);
    
    // Relativity: Lorentz factor (speed of light c = 300 units/sec in simulator)
    const c = 300.0;
    const vRatio = Math.min(0.999, velocityMagnitude / c);
    const lorentzFactor = 1.0 / Math.sqrt(1.0 - vRatio * vRatio);

    return {
      timeStep: state.timeStep,
      parameters: state.parameters,
      entities,
      metrics: {
        kineticEnergy,
        potentialEnergy,
        totalEnergy: kineticEnergy + potentialEnergy,
        lorentzFactor
      }
    };
  }

  public reset(parameters: Record<string, number>): SimulationState {
    return this.initialize(parameters);
  }

  public getVisualizationMetadata(state: SimulationState): Record<string, any> {
    return {
      renderType: 'canvas2d',
      drawInstructions: state.entities.map((e) => ({
        type: 'arc',
        x: e.x,
        y: e.y,
        radius: 12 + e.mass * 0.3,
        color: '#3b82f6'
      }))
    };
  }
}
