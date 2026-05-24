/**
 * Progression Analyzer (Learning Analytics Engine)
 */

import { InteractionLog, LearningAnalytics } from '../types';

export class ProgressionAnalyzer {
  /**
   * Computes high-resolution learning metrics from raw interaction logs.
   */
  static calculateAnalytics(logs: InteractionLog[], streak: number): LearningAnalytics {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;
    const thirtyDaysMs = 30 * oneDayMs;

    // Filter logs for different windows
    const recentLogs = logs.filter((l) => now - l.timestamp <= sevenDaysMs);
    const monthLogs = logs.filter((l) => now - l.timestamp <= thirtyDaysMs);

    // 1. Learning Momentum (0.0 to 1.0)
    // Combines active streak weight and recent 7-day interaction density
    const recentDensity = Math.min(1.0, recentLogs.length / 14.0); // 14 interactions a week is max momentum
    const streakWeight = Math.min(1.0, streak / 7.0); // 7 day streak is max streak boost
    const momentum = parseFloat((recentDensity * 0.6 + streakWeight * 0.4).toFixed(3));

    // 2. Cognitive Velocity
    // XP earned per day averaged over the last 7 days
    const totalRecentXP = recentLogs.reduce((sum, l) => sum + l.xpEarned, 0);
    const cognitiveVelocity = parseFloat((totalRecentXP / 7.0).toFixed(2));

    // 3. Session Frequency
    // Average number of study sessions per week based on last 30 days
    const distinctDays = new Set<string>();
    for (const log of monthLogs) {
      const dateKey = new Date(log.timestamp).toDateString();
      distinctDays.add(dateKey);
    }
    const sessionFrequency = parseFloat(((distinctDays.size / 30.0) * 7.0).toFixed(2));

    // 4. Consistency (0.0 to 1.0)
    // Standard deviation of time gaps between study interactions. High consistency = regular gaps.
    let consistency = 0.5; // fallback
    if (distinctDays.size > 2) {
      const sortedTimestamps = monthLogs
        .map((l) => l.timestamp)
        .sort((a, b) => a - b);

      const gaps: number[] = [];
      for (let i = 1; i < sortedTimestamps.length; i++) {
        gaps.push((sortedTimestamps[i] - sortedTimestamps[i - 1]) / oneDayMs);
      }

      const meanGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
      const squaredDiffs = gaps.map((g) => Math.pow(g - meanGap, 2));
      const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / gaps.length;
      const stdDev = Math.sqrt(variance);

      // Low stdDev yields high consistency: consistency = 1 / (1 + stdDev)
      consistency = parseFloat((1.0 / (1.0 + stdDev * 0.5)).toFixed(3));
    }

    return {
      momentum,
      cognitiveVelocity,
      sessionFrequency,
      consistency
    };
  }
}
