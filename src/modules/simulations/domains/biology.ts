/**
 * Biology Domain Plugin (Epidemiology SIR Model & Population Growth)
 */

import { ISimulationPlugin, SimulationState } from '../types';

export class BiologyPlugin implements ISimulationPlugin {
  public id = 'biology-engine';
  public name = 'Population SIR Model';
  public domain = 'Biology' as const;

  public initialize(parameters: Record<string, number>): SimulationState {
    const populationSize = parameters.populationSize ?? 200.0;
    const transmissionRate = parameters.transmissionRate ?? 0.03;
    const recoveryRate = parameters.recoveryRate ?? 0.05;

    // Build population entities (Susceptible, Infected, Recovered)
    const entities: any[] = [];
    for (let i = 0; i < populationSize; i++) {
      entities.push({
        id: `cell-${i}`,
        state: i < 3 ? 'I' : 'S', // 3 initial infected cells
        x: Math.random() * 600,
        y: Math.random() * 400,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80
      });
    }

    return {
      timeStep: 0,
      parameters: { populationSize, transmissionRate, recoveryRate },
      entities,
      metrics: {
        susceptible: populationSize - 3,
        infected: 3,
        recovered: 0
      }
    };
  }

  public update(state: SimulationState, deltaTime: number): SimulationState {
    const { transmissionRate, recoveryRate } = state.parameters;
    const entities = [...state.entities];

    // 1. Move entities and handle state transitions
    let susceptible = 0;
    let infected = 0;
    let recovered = 0;

    for (let i = 0; i < entities.length; i++) {
      const ent = entities[i];

      // Update positions
      let x = ent.x + ent.vx * deltaTime;
      let y = ent.y + ent.vy * deltaTime;

      // Bounce off borders
      if (x < 0 || x > 600) ent.vx = -ent.vx;
      if (y < 0 || y > 400) ent.vy = -ent.vy;

      // Ensure boundary limits
      x = Math.max(0, Math.min(600, x));
      y = Math.max(0, Math.min(400, y));

      // Handle infection states
      if (ent.state === 'I') {
        // Recovery logic
        if (Math.random() < recoveryRate * deltaTime) {
          ent.state = 'R';
        }
      }

      ent.x = x;
      ent.y = y;
    }

    // 2. Proximity-based transmission logic (S + I -> 2I)
    for (let i = 0; i < entities.length; i++) {
      const cellA = entities[i];
      if (cellA.state !== 'I') continue;

      for (let j = 0; j < entities.length; j++) {
        const cellB = entities[j];
        if (cellB.state !== 'S') continue;

        // Calculate distance
        const dx = cellA.x - cellB.x;
        const dy = cellA.y - cellB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // If close enough, transmit infection
        if (dist < 20 && Math.random() < transmissionRate) {
          cellB.state = 'I';
        }
      }
    }

    // Count metrics
    for (const ent of entities) {
      if (ent.state === 'S') susceptible++;
      else if (ent.state === 'I') infected++;
      else if (ent.state === 'R') recovered++;
    }

    return {
      timeStep: state.timeStep,
      parameters: state.parameters,
      entities,
      metrics: { susceptible, infected, recovered }
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
        radius: 5,
        color: e.state === 'S' ? '#10b981' : e.state === 'I' ? '#ef4444' : '#6b7280'
      }))
    };
  }
}
