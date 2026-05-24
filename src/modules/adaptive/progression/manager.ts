/**
 * Dynamic Progression Manager
 */

import { ConceptMastery, LearningAnalytics } from '../types';

export type LearningPace = 'deliberate' | 'normal' | 'accelerated';

export interface ProgressionGuideline {
  pace: LearningPace;
  suggestedExplorationDepth: number;
  showWeakConnections: boolean;
  densityLevel: 'low' | 'medium' | 'high';
}

export class DynamicProgressionManager {
  /**
   * Resolves the customized progression guidelines based on analytics and active mastery.
   */
  static getProgressionGuidelines(
    analytics: LearningAnalytics,
    activeMasteries: ConceptMastery[]
  ): ProgressionGuideline {
    // 1. Determine Learning Pace
    // Check if the user is currently experiencing high confusion on active concepts
    const activeConfusionList = activeMasteries.filter((m) => m.confusionProbability > 0.5);
    const isStruggling = activeConfusionList.length >= 2;

    let pace: LearningPace = 'normal';

    if (isStruggling) {
      pace = 'deliberate';
    } else if (analytics.momentum > 0.75 && analytics.consistency > 0.7) {
      pace = 'accelerated';
    }

    // 2. Determine matrix visual configurations based on pace
    let suggestedExplorationDepth = 2;
    let showWeakConnections = false;
    let densityLevel: ProgressionGuideline['densityLevel'] = 'medium';

    if (pace === 'deliberate') {
      suggestedExplorationDepth = 1; // zoom in, simplify visual clutter
      showWeakConnections = false;
      densityLevel = 'low';
    } else if (pace === 'accelerated') {
      suggestedExplorationDepth = 3; // unlock deep orbits
      showWeakConnections = true;
      densityLevel = 'high';
    }

    return {
      pace,
      suggestedExplorationDepth,
      showWeakConnections,
      densityLevel
    };
  }
}
