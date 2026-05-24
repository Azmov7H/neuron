/**
 * Anatomy Domain Plugin (Cardiac Pulse & Axonal Action Potential)
 */

import { ISimulationPlugin, SimulationState } from '../types';

export class AnatomyPlugin implements ISimulationPlugin {
  public id = 'anatomy-engine';
  public name = 'Action Potential Propagation';
  public domain = 'Anatomy' as const;

  public initialize(parameters: Record<string, number>): SimulationState {
    const heartRate = parameters.heartRate ?? 72.0; // BPM
    const stimulusStrength = parameters.stimulusStrength ?? 1.5;

    // Neuron nodes mapping potential propagation
    const entities: any[] = [];
    const nodeCount = 15;
    for (let i = 0; i < nodeCount; i++) {
      entities.push({
        id: `node-${i}`,
        index: i,
        x: 50 + i * 45,
        y: 200,
        voltage: -70.0, // baseline resting potential -70mV
        state: 'resting' // resting, depolarizing, repolarizing, refractory
      });
    }

    return {
      timeStep: 0,
      parameters: { heartRate, stimulusStrength },
      entities,
      metrics: {
        avgVoltage: -70.0,
        propagationVelocity: 0.0,
        heartPulsePhase: 0.0
      }
    };
  }

  public update(state: SimulationState, deltaTime: number): SimulationState {
    const { heartRate, stimulusStrength } = state.parameters;
    const entities = state.entities.map(e => ({ ...e }));
    const time = state.timeStep * deltaTime;

    // 1. Action Potential propagation trigger
    // Periodically trigger a wave from node-0 based on heartRate frequency
    const pulseInterval = 60.0 / heartRate;
    const waveTrigger = (state.timeStep % Math.round(pulseInterval / deltaTime)) === 0;

    if (waveTrigger && entities[0].state === 'resting') {
      entities[0].voltage = 30.0 * stimulusStrength; // depolarize initial node
      entities[0].state = 'depolarizing';
    }

    // 2. Propagate potential across nodes
    for (let i = 0; i < entities.length; i++) {
      const current = entities[i];

      // resting voltage drift
      if (current.state === 'resting') {
        current.voltage = -70.0;
      } else if (current.state === 'depolarizing') {
        current.voltage += 120.0 * deltaTime;
        if (current.voltage >= 40.0) {
          current.voltage = 40.0;
          current.state = 'repolarizing';

          // Trigger next neighbor
          if (i + 1 < entities.length && entities[i + 1].state === 'resting') {
            entities[i + 1].state = 'depolarizing';
            entities[i + 1].voltage = -50.0; // cross threshold
          }
        }
      } else if (current.state === 'repolarizing') {
        current.voltage -= 180.0 * deltaTime;
        if (current.voltage <= -80.0) {
          current.voltage = -80.0;
          current.state = 'refractory';
        }
      } else if (current.state === 'refractory') {
        current.voltage += 40.0 * deltaTime;
        if (current.voltage >= -70.0) {
          current.voltage = -70.0;
          current.state = 'resting';
        }
      }
    }

    // Compute metrics
    const avgVoltage = entities.reduce((sum, e) => sum + e.voltage, 0) / entities.length;
    const activeNodeCount = entities.filter(e => e.state !== 'resting').length;

    return {
      timeStep: state.timeStep,
      parameters: state.parameters,
      entities,
      metrics: {
        avgVoltage,
        propagationVelocity: activeNodeCount * 12.5, // units/sec representation
        heartPulsePhase: Math.sin(time * (heartRate / 60) * Math.PI * 2)
      }
    };
  }

  public reset(parameters: Record<string, number>): SimulationState {
    return this.initialize(parameters);
  }

  public getVisualizationMetadata(state: SimulationState): Record<string, any> {
    return {
      renderType: 'canvas2d',
      drawInstructions: state.entities.map((e) => {
        // Color changes depending on action potential phase
        const charge = (e.voltage + 80.0) / 120.0; // normalize
        const red = Math.round(charge * 255);
        const blue = Math.round((1 - charge) * 255);
        return {
          type: 'arc',
          x: e.x,
          y: e.y,
          radius: 8 + charge * 6,
          color: `rgb(${red}, 60, ${blue})`
        };
      })
    };
  }
}
