/**
 * Mathematics Domain Plugin (Galton Board Probability Simulator)
 */

import { ISimulationPlugin, SimulationState } from '../types';

export class MathematicsPlugin implements ISimulationPlugin {
  public id = 'mathematics-engine';
  public name = 'Galton Board Probability';
  public domain = 'Mathematics' as const;

  // Peg matrix positions in the triangle
  private pegs: { x: number; y: number }[] = [];

  constructor() {
    // Generate triangle of pegs
    const rows = 8;
    for (let r = 0; r < rows; r++) {
      const y = 80 + r * 35;
      const startX = 350 - (r * 20);
      for (let c = 0; c <= r; c++) {
        this.pegs.push({ x: startX + c * 40, y });
      }
    }
  }

  public initialize(parameters: Record<string, number>): SimulationState {
    const ballsCount = parameters.ballsCount ?? 150.0;
    const probabilityLeft = parameters.probabilityLeft ?? 0.5;

    // Collect bin counts for histogram
    const binCount = 9; // rows + 1 bins
    const bins = new Array(binCount).fill(0);

    return {
      timeStep: 0,
      parameters: { ballsCount, probabilityLeft },
      entities: [
        // start with single ball dropping
        { id: 'ball-0', x: 350, y: 30, vx: 0, vy: 120, state: 'dropping', nextPegRow: 0 }
      ],
      metrics: {
        droppedBallsCount: 0,
        binomialMean: binCount * probabilityLeft,
        systemEntropy: 0
      }
    };
  }

  public update(state: SimulationState, deltaTime: number): SimulationState {
    const { ballsCount, probabilityLeft } = state.parameters;
    const entities = state.entities.map(e => ({ ...e }));
    let droppedBallsCount = state.metrics.droppedBallsCount || 0;

    // Spawn new balls periodically up to ballsCount
    if (state.timeStep % 20 === 0 && droppedBallsCount < ballsCount) {
      const nextId = `ball-${droppedBallsCount}`;
      // Verify duplicate prevention
      if (!entities.some(e => e.id === nextId)) {
        entities.push({
          id: nextId,
          x: 350 + (Math.random() - 0.5) * 4,
          y: 20,
          vx: 0,
          vy: 140,
          state: 'dropping',
          nextPegRow: 0
        });
        droppedBallsCount++;
      }
    }

    // Update ball physics with pegs collision
    for (const ball of entities) {
      if (ball.state !== 'dropping') continue;

      ball.y += ball.vy * deltaTime;
      ball.x += ball.vx * deltaTime;

      // Peg collision detection
      for (const peg of this.pegs) {
        const dx = ball.x - peg.x;
        const dy = ball.y - peg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) {
          // Bounce: decide left or right based on probabilityLeft parameter
          const goLeft = Math.random() < probabilityLeft;
          ball.vx = goLeft ? -45 : 45;
          ball.vy = 80; // slow down slightly upon impact
          // Push slightly off peg to prevent double collision
          ball.y = peg.y + 6;
          ball.x = peg.x + (goLeft ? -4 : 4);
          break;
        }
      }

      // Gravity acceleration
      ball.vy += 80 * deltaTime;

      // Decelerate horizontal velocity gradually
      ball.vx *= (1 - 2 * deltaTime);

      // Floor check
      if (ball.y > 380) {
        ball.y = 380;
        ball.vx = 0;
        ball.vy = 0;
        ball.state = 'landed';
      }
    }

    // Calculate entropy from landed positions (grouped in slots/bins)
    const bins = new Array(10).fill(0);
    for (const ball of entities) {
      if (ball.state === 'landed') {
        const binIndex = Math.min(9, Math.max(0, Math.floor((ball.x - 170) / 40)));
        bins[binIndex]++;
      }
    }

    const totalLanded = entities.filter(e => e.state === 'landed').length;
    let entropy = 0;
    if (totalLanded > 0) {
      for (const count of bins) {
        if (count > 0) {
          const p = count / totalLanded;
          entropy -= p * Math.log2(p);
        }
      }
    }

    return {
      timeStep: state.timeStep,
      parameters: state.parameters,
      entities,
      metrics: {
        droppedBallsCount,
        binomialMean: 8 * (1 - probabilityLeft), // Triangle width representation
        systemEntropy: entropy
      }
    };
  }

  public reset(parameters: Record<string, number>): SimulationState {
    return this.initialize(parameters);
  }

  public getVisualizationMetadata(state: SimulationState): Record<string, any> {
    const drawInstructions: any[] = [];

    // Draw static pegs
    for (const peg of this.pegs) {
      drawInstructions.push({
        type: 'arc',
        x: peg.x,
        y: peg.y,
        radius: 3,
        color: '#f43f5e'
      });
    }

    // Draw active dropping balls
    for (const ball of state.entities) {
      drawInstructions.push({
        type: 'arc',
        x: ball.x,
        y: ball.y,
        radius: 6,
        color: ball.state === 'dropping' ? '#e2e8f0' : '#475569'
      });
    }

    return {
      renderType: 'canvas2d',
      drawInstructions
    };
  }
}
