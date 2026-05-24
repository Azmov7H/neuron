/**
 * Cognitive Profiler Engine
 */

import { CognitiveProfile, ConceptMastery, InteractionLog, SimulationActivity, SparkMessageLog } from '../types';

export class CognitiveProfiler {
  /**
   * Refreshes the cognitive profile of the user based on overall learning behavior and mastery records.
   */
  static updateProfile(
    userId: string,
    current: CognitiveProfile | null,
    logs: InteractionLog[],
    simulationLogs: SimulationActivity[],
    sparkLogs: SparkMessageLog[],
    masteryList: ConceptMastery[],
    domainMapping: Record<string, string> // maps conceptId to domain
  ): CognitiveProfile {
    const now = Date.now();

    // 1. Group mastery records by domain
    const domainMasteries: Record<string, { total: number; count: number }> = {};
    for (const mastery of masteryList) {
      const domain = domainMapping[mastery.conceptId] || 'Other';
      if (!domainMasteries[domain]) {
        domainMasteries[domain] = { total: 0, count: 0 };
      }
      domainMasteries[domain].total += mastery.masteryScore;
      domainMasteries[domain].count += 1;
    }

    // 2. Identify Strengths and Weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    for (const [domain, stats] of Object.entries(domainMasteries)) {
      const avg = stats.total / stats.count;
      if (avg >= 0.7) {
        strengths.push(domain);
      } else if (avg < 0.4) {
        weaknesses.push(domain);
      }
    }

    // 3. Preferred Domains (by interaction density)
    const domainInteractions: Record<string, number> = {};
    for (const log of logs) {
      domainInteractions[log.domain] = (domainInteractions[log.domain] || 0) + 1;
    }
    for (const log of sparkLogs) {
      domainInteractions[log.domain] = (domainInteractions[log.domain] || 0) + 1;
    }

    const preferredDomains = Object.entries(domainInteractions)
      .sort((a, b) => b[1] - a[1])
      .map(([domain]) => domain)
      .slice(0, 3);

    // 4. Learning Style Inference
    // Counts to compare visual/simulations vs reading-writing/text
    const simInteractions = simulationLogs.length;
    const sparkInteractions = sparkLogs.length;

    let learningStyle: CognitiveProfile['learningStyle'] = current?.learningStyle ?? 'visual';

    if (simInteractions > 0 || sparkInteractions > 0) {
      if (simInteractions > sparkInteractions * 1.5) {
        // High action counts suggest kinesthetic learning style
        const avgActions = simulationLogs.reduce((acc, s) => acc + s.actionsPerformed, 0) / simInteractions;
        learningStyle = avgActions > 15 ? 'kinesthetic' : 'visual';
      } else if (sparkInteractions > simInteractions * 1.5) {
        learningStyle = 'reading-writing';
      } else {
        learningStyle = 'visual'; // default immersive choice
      }
    }

    // 5. XP and Streak
    const totalXP = current?.totalXP ?? logs.reduce((sum, l) => sum + l.xpEarned, 0);
    const streak = current?.streak ?? 0;

    return {
      userId,
      strengths,
      weaknesses,
      preferredDomains: preferredDomains.length > 0 ? preferredDomains : (current?.preferredDomains ?? []),
      learningStyle,
      totalXP,
      streak,
      lastUpdated: now
    };
  }
}
