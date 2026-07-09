import { CognitiveProfile } from '@/database/models/cognitive-profile';
import { User } from '@/database/models/user';
import { Discovery } from '@/database/models/discovery';
import { SparkSession } from '@/database/models/spark-session';
import { SimulationRun } from '@/database/models/simulation-run';
import { SimulationHistory } from '@/database/models/simulation-history';
import { UserProgress } from '@/database/models/user-progress';
import { AppError } from '@/types';
import { UpdateCognitiveProfileInput } from '@/validations/schemas';

export class CognitiveProfileService {
  /**
   * Get or create cognitive profile for user
   */
  static async getOrCreateProfile(userId: string) {
    let profile = await CognitiveProfile.findOne({ userId });

    if (!profile) {
      profile = await CognitiveProfile.create({
        userId,
        learningStyle: {
          visual: 50,
          reading: 50,
          simulation: 50,
          practical: 50,
          theory: 50,
        },
        attention: {
          focusDuration: 25,
          attentionSpan: 50,
          distractionFrequency: 2,
          peakFocusHours: [9, 14, 19],
        },
        retention: {
          shortTerm: 50,
          mediumTerm: 50,
          longTerm: 50,
          recallStrength: 50,
        },
        curiosity: 50,
        explorationRate: 50,
        problemSolving: 50,
        learningSpeed: 50,
        strongDomains: [],
        weakDomains: [],
        masteredConcepts: [],
        recentConcepts: [],
        preferredDifficulty: 'adaptive',
        aiInteractionStyle: 'collaborative',
        explanationPreference: 'detailed',
        confidenceScore: 50,
        masteryScore: 0,
      });
    }

    return profile;
  }

  /**
   * Update cognitive profile
   */
  static async updateProfile(userId: string, input: UpdateCognitiveProfileInput) {
    const profile = await this.getOrCreateProfile(userId);

    const updateData: Record<string, unknown> = { lastUpdated: new Date(), version: (profile.version || 0) + 1 };

    if (input.learningStyle) {
      updateData['learningStyle'] = {
        visual: input.learningStyle.visual ?? profile.learningStyle?.visual ?? 50,
        reading: input.learningStyle.reading ?? profile.learningStyle?.reading ?? 50,
        simulation: input.learningStyle.simulation ?? profile.learningStyle?.simulation ?? 50,
        practical: input.learningStyle.practical ?? profile.learningStyle?.practical ?? 50,
        theory: input.learningStyle.theory ?? profile.learningStyle?.theory ?? 50,
      };
    }

    if (input.attention) {
      updateData['attention'] = {
        focusDuration: input.attention.focusDuration ?? profile.attention?.focusDuration ?? 25,
        attentionSpan: input.attention.attentionSpan ?? profile.attention?.attentionSpan ?? 50,
        distractionFrequency: input.attention.distractionFrequency ?? profile.attention?.distractionFrequency ?? 2,
        peakFocusHours: input.attention.peakFocusHours ?? profile.attention?.peakFocusHours ?? [9, 14, 19],
      };
    }

    if (input.retention) {
      updateData['retention'] = {
        shortTerm: input.retention.shortTerm ?? profile.retention?.shortTerm ?? 50,
        mediumTerm: input.retention.mediumTerm ?? profile.retention?.mediumTerm ?? 50,
        longTerm: input.retention.longTerm ?? profile.retention?.longTerm ?? 50,
        recallStrength: input.retention.recallStrength ?? profile.retention?.recallStrength ?? 50,
      };
    }

    if (input.curiosity !== undefined) updateData['curiosity'] = input.curiosity;
    if (input.explorationRate !== undefined) updateData['explorationRate'] = input.explorationRate;
    if (input.problemSolving !== undefined) updateData['problemSolving'] = input.problemSolving;
    if (input.learningSpeed !== undefined) updateData['learningSpeed'] = input.learningSpeed;
    if (input.strongDomains) updateData['strongDomains'] = input.strongDomains;
    if (input.weakDomains) updateData['weakDomains'] = input.weakDomains;
    if (input.masteredConcepts) updateData['masteredConcepts'] = input.masteredConcepts;
    if (input.recentConcepts) updateData['recentConcepts'] = input.recentConcepts;
    if (input.preferredDifficulty) updateData['preferredDifficulty'] = input.preferredDifficulty;
    if (input.aiInteractionStyle) updateData['aiInteractionStyle'] = input.aiInteractionStyle;
    if (input.explanationPreference) updateData['explanationPreference'] = input.explanationPreference;

    const updated = await CognitiveProfile.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return updated;
  }

  /**
   * Derive metrics from user behavior
   */
  static async deriveMetrics(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const profile = await this.getOrCreateProfile(userId);

    const updates: Record<string, unknown> = { lastUpdated: new Date() };

    if (user.domains && user.domains.length > 0) {
      const strongDomains = user.domains
        .filter((d) => d.mastery >= 70)
        .map((d) => d.domain);

      const weakDomains = user.domains
        .filter((d) => d.mastery < 50)
        .map((d) => d.domain);

      updates['strongDomains'] = strongDomains;
      updates['weakDomains'] = weakDomains;
    }

    if (user.discoveredConcepts && user.discoveredConcepts.length > 0) {
      updates['recentConcepts'] = user.discoveredConcepts.slice(-20);
    }

    const confidenceScore = Math.min(100, Math.round((user.totalXP || 0) / 10));
    const masteryScore = profile.masteryScore || 0;

    updates['confidenceScore'] = confidenceScore;
    updates['masteryScore'] = masteryScore;

    await CognitiveProfile.findOneAndUpdate({ userId }, { $set: updates });

    return this.getOrCreateProfile(userId);
  }

  // ============================================
  // AUTOMATIC METRIC DERIVATION
  // ============================================

  /**
   * Derive learning style from user interactions
   * Analyzes simulation usage, reading patterns, and practical engagement
   */
  static async deriveLearningStyle(userId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const [sparkSessions, simulationRuns, discoveries] = await Promise.all([
      SparkSession.find({ userId, 'messages.role': 'user' }).limit(100),
      SimulationRun.find({ userId }).limit(100),
      Discovery.find({ userId }).limit(100),
    ]);

    const interactionCounts = {
      simulation: simulationRuns.length,
      spark: sparkSessions.length,
      discovery: discoveries.length,
    };

    const totalInteractions = interactionCounts.simulation + interactionCounts.spark + interactionCounts.discovery;

    if (totalInteractions === 0) {
      return profile;
    }

    const simulationRatio = interactionCounts.simulation / totalInteractions;
    const sparkRatio = interactionCounts.spark / totalInteractions;
    const discoveryRatio = interactionCounts.discovery / totalInteractions;

    const learningStyle = {
      visual: Math.round(50 + (discoveryRatio * 30) - (sparkRatio * 10)),
      reading: Math.round(50 + (sparkRatio * 30) - (simulationRatio * 10)),
      simulation: Math.round(50 + (simulationRatio * 30) - (discoveryRatio * 5)),
      practical: Math.round(50 + (simulationRatio * 20) + (discoveryRatio * 10)),
      theory: Math.round(50 + (sparkRatio * 20) - (simulationRatio * 5)),
    };

    await CognitiveProfile.findOneAndUpdate(
      { userId },
      { $set: { learningStyle, lastUpdated: new Date(), version: (profile.version || 0) + 1 } }
    );

    return profile;
  }

  /**
   * Derive attention metrics from session data
   */
  static async deriveAttentionMetrics(userId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const progressDocs = await UserProgress.find({ userId }).limit(50);

    if (progressDocs.length === 0) {
      return profile;
    }

    const durations = progressDocs
      .filter((p) => p.timeSpent)
      .map((p) => p.timeSpent);

    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 25;

    const sessionCount = progressDocs.length;
    const attentionSpan = Math.min(100, 30 + sessionCount);
    const distractionFrequency = Math.max(1, Math.round(3 - (sessionCount / 10)));

    const hourSet = new Set<number>();
    progressDocs.forEach((p) => {
      if (p.updatedAt) {
        hourSet.add(p.updatedAt.getHours());
      }
    });

    const peakFocusHours = hourSet.size > 0
      ? Array.from(hourSet).slice(0, 3)
      : [9, 14, 19];

    await CognitiveProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          'attention.focusDuration': avgDuration,
          'attention.attentionSpan': attentionSpan,
          'attention.distractionFrequency': distractionFrequency,
          'attention.peakFocusHours': peakFocusHours,
          lastUpdated: new Date(),
          version: (profile.version || 0) + 1,
        },
      }
    );

    return profile;
  }

  /**
   * Derive retention metrics from concept mastery data
   */
  static async deriveRetentionMetrics(userId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const user = await User.findById(userId);
    if (!user || !user.domains) {
      return profile;
    }

    const masteryScores = user.domains.map((d) => d.mastery);
    const avgMastery = masteryScores.length > 0
      ? Math.round(masteryScores.reduce((a, b) => a + b, 0) / masteryScores.length)
      : 50;

    const retention = {
      shortTerm: avgMastery,
      mediumTerm: Math.round(avgMastery * 0.85),
      longTerm: Math.round(avgMastery * 0.7),
      recallStrength: Math.round(avgMastery * 0.9),
    };

    await CognitiveProfile.findOneAndUpdate(
      { userId },
      { $set: { retention, lastUpdated: new Date(), version: (profile.version || 0) + 1 } }
    );

    return profile;
  }

  /**
   * Derive curiosity from discovery patterns
   */
  static async deriveCuriosityMetrics(userId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const discoveryCount = await Discovery.countDocuments({ userId });
    const recentDiscoveries = await Discovery.find({ userId })
      .sort({ discoveredAt: -1 })
      .limit(30);

    const curiosity = Math.min(100, Math.round(20 + discoveryCount * 2));
    const explorationRate = recentDiscoveries.length > 0
      ? Math.min(100, 50 + recentDiscoveries.length * 5)
      : 50;

    await CognitiveProfile.findOneAndUpdate(
      { userId },
      { $set: { curiosity, explorationRate, lastUpdated: new Date(), version: (profile.version || 0) + 1 } }
    );

    return profile;
  }

  /**
   * Derive problem-solving ability from simulation performance
   */
  static async deriveProblemSolvingMetrics(userId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const history = await SimulationHistory.findOne({ userId });
    if (!history) {
      return profile;
    }

    const attempts: Array<{ score: number; completedAt: Date }> = [];
    history.simulations.forEach((sim) => {
      sim.attempts.forEach((a) => {
        if (a.completedAt) {
          attempts.push({ score: a.score, completedAt: a.completedAt });
        }
      });
    });

    if (attempts.length === 0) {
      return profile;
    }

    const avgScore = attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length;
    const improvementRate = this.calculateImprovementRate(attempts);

    const problemSolving = Math.round(avgScore * 0.8 + improvementRate * 10);

    await CognitiveProfile.findOneAndUpdate(
      { userId },
      { $set: { problemSolving, lastUpdated: new Date(), version: (profile.version || 0) + 1 } }
    );

    return profile;
  }

  /**
   * Derive learning speed from progress completion rates
   */
  static async deriveLearningSpeed(userId: string) {
    const profile = await this.getOrCreateProfile(userId);

    const progressDocs = await UserProgress.find({ userId });

    if (progressDocs.length === 0) {
      return profile;
    }

    const completionRates = progressDocs
      .filter((p) => p.overallCompletion)
      .map((p) => p.overallCompletion);

    const avgCompletion = completionRates.length > 0
      ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length
      : 50;

    const learningSpeed = Math.round(avgCompletion);

    await CognitiveProfile.findOneAndUpdate(
      { userId },
      { $set: { learningSpeed, lastUpdated: new Date(), version: (profile.version || 0) + 1 } }
    );

    return profile;
  }

  /**
   * Fully update all derived metrics
   */
  static async updateAllDerivedMetrics(userId: string) {
    await Promise.all([
      this.deriveLearningStyle(userId),
      this.deriveAttentionMetrics(userId),
      this.deriveRetentionMetrics(userId),
      this.deriveCuriosityMetrics(userId),
      this.deriveProblemSolvingMetrics(userId),
      this.deriveLearningSpeed(userId),
      this.deriveMetrics(userId),
    ]);

    return this.getOrCreateProfile(userId);
  }

  /**
   * Helper: Calculate improvement rate from simulation runs
   */
  private static calculateImprovementRate(runs: { score: number; completedAt: Date }[]): number {
    if (runs.length < 2) return 0;

    const sorted = [...runs].sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

    const firstAvg = firstHalf.reduce((sum, r) => sum + r.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, r) => sum + r.score, 0) / secondHalf.length;

    return Math.round((secondAvg - firstAvg) / 100);
  }
}