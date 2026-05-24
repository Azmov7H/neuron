/**
 * Difficulty Governor (Dynamic Difficulty Adjustment)
 */

import { ConceptMastery } from '../types';

export type ExplanationDepth = 'foundational' | 'standard' | 'advanced';

export interface SimulationParameters {
  maxNodes: number;
  initialSpeedMultiplier: number;
  noiseLevel: number;
  hudSimplification: boolean;
  allowManualOverrides: boolean;
}

export class DifficultyGovernor {
  /**
   * Resolves the Spark explanation depth based on user concept mastery and confusion probability.
   */
  static getExplanationDepth(mastery: ConceptMastery | null): ExplanationDepth {
    if (!mastery) return 'foundational';

    // Struggling or newly introduced
    if (mastery.confusionProbability > 0.6 || mastery.masteryScore < 0.3) {
      return 'foundational';
    }

    // High mastery and low confusion
    if (mastery.masteryScore >= 0.75 && mastery.confusionProbability <= 0.25) {
      return 'advanced';
    }

    return 'standard';
  }

  /**
   * Resolves dynamic simulation config adjustments to match user's cognitive limits.
   */
  static getSimulationParameters(mastery: ConceptMastery | null): SimulationParameters {
    if (!mastery) {
      return {
        maxNodes: 25,
        initialSpeedMultiplier: 1.0,
        noiseLevel: 0.0,
        hudSimplification: true,
        allowManualOverrides: false
      };
    }

    const { masteryScore, confusionProbability } = mastery;

    if (confusionProbability > 0.65 || masteryScore < 0.25) {
      // Struggling: simpler HUD, no noise, low speeds
      return {
        maxNodes: 15,
        initialSpeedMultiplier: 0.8,
        noiseLevel: 0.0,
        hudSimplification: true,
        allowManualOverrides: false
      };
    }

    if (masteryScore >= 0.8 && confusionProbability < 0.2) {
      // Advanced: max nodes, active perturbations/noise, full capabilities unlocked
      return {
        maxNodes: 60,
        initialSpeedMultiplier: 1.25,
        noiseLevel: 0.15, // realistic physical noise
        hudSimplification: false,
        allowManualOverrides: true
      };
    }

    // Default standard settings
    return {
      maxNodes: 35,
      initialSpeedMultiplier: 1.0,
      noiseLevel: 0.02,
      hudSimplification: false,
      allowManualOverrides: true
    };
  }
}
