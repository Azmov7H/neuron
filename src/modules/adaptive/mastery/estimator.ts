/**
 * Mastery Estimator (Cognitive Mastery System)
 */

import { ConceptMastery, InteractionLog, SimulationActivity, SparkMessageLog } from '../types';

export class MasteryEstimator {
  /**
   * Estimates and updates the mastery metrics for a concept based on activity logs.
   */
  static estimateMastery(
    conceptId: string,
    current: ConceptMastery | null,
    logs: InteractionLog[],
    simulationLogs: SimulationActivity[],
    sparkLogs: SparkMessageLog[]
  ): ConceptMastery {
    const now = Date.now();
    const conceptLogs = logs.filter((l) => l.conceptId === conceptId);
    
    // 1. Initial State or Default
    const prevFamiliarity = current?.familiarity ?? 0.0;
    const prevMastery = current?.masteryScore ?? 0.0;
    const prevConfusion = current?.confusionProbability ?? 0.1;

    if (conceptLogs.length === 0 && simulationLogs.length === 0 && sparkLogs.length === 0) {
      // No new interactions; just decay with time
      return current ? this.applyTimeDecay(current, now) : {
        conceptId,
        familiarity: 0,
        masteryScore: 0,
        confusionProbability: 0,
        revisitPriority: 0,
        lastInteractionTimestamp: now
      };
    }

    // 2. Familiarity Calculation
    // Familiarity increases with the quantity of views, chats, and runs
    const totalInteractions = conceptLogs.length + simulationLogs.length + sparkLogs.length;
    const familiarity = Math.min(1.0, prevFamiliarity + totalInteractions * 0.12);

    // 3. Mastery Score Calculation
    // Mastery is earned through high performance in simulations & milestones completion
    let masteryGained = 0.0;

    // Simulation success boost
    for (const sim of simulationLogs) {
      if (sim.successRate >= 0.75) {
        masteryGained += 0.20; // major boost
      } else if (sim.successRate >= 0.5) {
        masteryGained += 0.08;
      }
    }

    // Milestone completions
    const milestones = conceptLogs.filter((l) => l.type === 'path_milestone');
    masteryGained += milestones.length * 0.25;

    // Active learning conversations
    const deepSparkChats = sparkLogs.filter((s) => s.userMessageLength > 100);
    masteryGained += deepSparkChats.length * 0.04;

    const rawMastery = prevMastery + masteryGained;
    const masteryScore = Math.min(1.0, Math.max(0.0, rawMastery));

    // 4. Confusion Probability Calculation
    // Rises with failed simulations and repeated clarifications, drops with success
    let confusionShift = 0.0;

    for (const sim of simulationLogs) {
      if (sim.successRate < 0.4) {
        confusionShift += 0.22;
      } else if (sim.successRate >= 0.8) {
        confusionShift -= 0.15;
      }
    }

    for (const spark of sparkLogs) {
      if (spark.askedClarification) {
        confusionShift += 0.15; // User asking "I don't understand"
      }
      if (spark.repliedClarification) {
        confusionShift -= 0.08; // Resolved confusion
      }
    }

    const confusionProbability = Math.min(
      1.0,
      Math.max(0.0, prevConfusion + confusionShift)
    );

    // 5. Revisit Priority Calculation (Forgetting Curve)
    const revisitPriority = this.calculateRevisitPriority(
      masteryScore,
      confusionProbability,
      now,
      now // last interaction is now because we have new logs
    );

    return {
      conceptId,
      familiarity: parseFloat(familiarity.toFixed(4)),
      masteryScore: parseFloat(masteryScore.toFixed(4)),
      confusionProbability: parseFloat(confusionProbability.toFixed(4)),
      revisitPriority: parseFloat(revisitPriority.toFixed(4)),
      lastInteractionTimestamp: now
    };
  }

  /**
   * Applies forgetting curve to decay mastery/familiarity and increase revisit priority over time.
   */
  private static applyTimeDecay(current: ConceptMastery, now: number): ConceptMastery {
    const hoursElapsed = (now - current.lastInteractionTimestamp) / (1000 * 60 * 60);

    // Forgetting curve: R = exp(-t / S) where S is strength (modeled by masteryScore)
    const stability = Math.max(24.0, current.masteryScore * 720.0); // stability between 1 day and 30 days
    const retention = Math.exp(-hoursElapsed / stability);

    // Familiarity decays slowly
    const familiarity = Math.max(0.0, current.familiarity * (0.9 + 0.1 * retention));
    
    // Mastery decays slightly to reflect fading memory (retained if revised)
    const masteryScore = Math.max(0.0, current.masteryScore * (0.85 + 0.15 * retention));

    // Confusion decays to neutrality (0.1) or stays similar
    const confusionProbability = current.confusionProbability;

    const revisitPriority = this.calculateRevisitPriority(
      masteryScore,
      confusionProbability,
      now,
      current.lastInteractionTimestamp
    );

    return {
      conceptId: current.conceptId,
      familiarity: parseFloat(familiarity.toFixed(4)),
      masteryScore: parseFloat(masteryScore.toFixed(4)),
      confusionProbability: parseFloat(confusionProbability.toFixed(4)),
      revisitPriority: parseFloat(revisitPriority.toFixed(4)),
      lastInteractionTimestamp: current.lastInteractionTimestamp
    };
  }

  /**
   * Calculates the revisit priority based on decay, mastery, and confusion.
   */
  private static calculateRevisitPriority(
    mastery: number,
    confusion: number,
    now: number,
    lastInteraction: number
  ): number {
    const hoursElapsed = (now - lastInteraction) / (1000 * 60 * 60);

    // Time decay factor: 1 - exp(-t / 168) (decays over a week)
    const decay = 1.0 - Math.exp(-hoursElapsed / 168.0);

    // Revisit Priority = (1 - mastery) * 0.3 + confusion * 0.4 + decay * 0.3
    const priority = (1.0 - mastery) * 0.3 + confusion * 0.4 + decay * 0.3;

    return Math.min(1.0, Math.max(0.0, priority));
  }
}
