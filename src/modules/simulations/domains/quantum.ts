/**
 * Quantum Mechanics Domain Plugin
 * Deterministic Wave Function & Heisenberg Uncertainty Simulator
 */

import { ISimulationPlugin, SimulationState } from '../types';

export class QuantumPlugin implements ISimulationPlugin {
  public id = 'quantum-engine';
  public name = 'Quantum Wave Function Simulator';
  public domain = 'Quantum' as const;

  public initialize(parameters: Record<string, number>): SimulationState {
    const quantumNumber = Math.round(parameters.quantumNumber ?? 3.0);
    const energyLevel = parameters.energyLevel ?? 1.0;
    const uncertaintySpread = parameters.uncertaintySpread ?? 1.0;

    // Generate initial wave function probability amplitudes across 80 points
    const gridPoints = 80;
    const entities: any[] = [];

    for (let i = 0; i < gridPoints; i++) {
      const x = (i / gridPoints) * 2 * Math.PI;
      const psi = Math.sin(quantumNumber * x); // standing wave ψ(x) = sin(n·x)
      const probability = psi * psi; // |ψ|²

      entities.push({
        id: `wave-${i}`,
        index: i,
        x: (i / gridPoints) * 700,
        y: 200,
        psi,
        probability,
        phase: 0
      });
    }

    return {
      timeStep: 0,
      parameters: { quantumNumber, energyLevel, uncertaintySpread },
      entities,
      metrics: {
        energyEigenvalue: energyLevel * quantumNumber * quantumNumber, // E_n = n²·E₁
        positionUncertainty: uncertaintySpread / quantumNumber,
        momentumUncertainty: quantumNumber / uncertaintySpread,
        heisenbergProduct: 0.5 // ΔxΔp ≥ ℏ/2
      }
    };
  }

  public update(state: SimulationState, deltaTime: number): SimulationState {
    const { quantumNumber, energyLevel, uncertaintySpread } = state.parameters;
    const n = Math.round(quantumNumber);
    const E = energyLevel * n * n;

    // Time-dependent phase evolution: ψ(x,t) = sin(nx)·e^(-iEt/ℏ)
    // Simplified real-valued: ψ(x,t) = sin(nx)·cos(Et)
    const phaseAngle = (state.timeStep * deltaTime * E * 0.3) % (2 * Math.PI);

    const entities = state.entities.map((ent) => {
      const x = (ent.index / state.entities.length) * 2 * Math.PI;
      const psi = Math.sin(n * x) * Math.cos(phaseAngle);
      const probability = psi * psi;

      return { ...ent, psi, probability, phase: phaseAngle };
    });

    // Heisenberg Uncertainty: ΔxΔp ≥ ℏ/2
    const positionUncertainty = uncertaintySpread / n;
    const momentumUncertainty = n / uncertaintySpread;
    const heisenbergProduct = positionUncertainty * momentumUncertainty;

    return {
      timeStep: state.timeStep,
      parameters: state.parameters,
      entities,
      metrics: {
        energyEigenvalue: E,
        positionUncertainty,
        momentumUncertainty,
        heisenbergProduct
      }
    };
  }

  public reset(parameters: Record<string, number>): SimulationState {
    return this.initialize(parameters);
  }

  public getVisualizationMetadata(state: SimulationState): Record<string, any> {
    const n = Math.round(state.parameters.quantumNumber);
    return {
      renderType: 'canvas2d',
      drawInstructions: state.entities.map((e) => ({
        type: 'line-point',
        x: e.x,
        // Wave centered at y=200 with amplitude of 80px
        y: 200 - e.psi * 80,
        probability: e.probability,
        color: `hsl(${260 + e.probability * 60}, 80%, 65%)`
      })),
      overlayLabels: [
        { x: 20, y: 20, text: `n = ${n}`, color: '#a855f7' },
        { x: 20, y: 40, text: `E = ${state.metrics.energyEigenvalue.toFixed(2)} eV`, color: '#c4b5fd' },
        { x: 20, y: 60, text: `ΔxΔp = ${state.metrics.heisenbergProduct.toFixed(3)}`, color: '#818cf8' }
      ]
    };
  }
}
