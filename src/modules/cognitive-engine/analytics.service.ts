import { LearningAnalytics } from '@/database/models/analytics';
import { RecordDailyAnalyticsInput, RecordConceptMasteryInput } from '@/validations/schemas';

export class AnalyticsService {
  /**
   * Get or create analytics for user
   */
  static async getOrCreateAnalytics(userId: string) {
    let analytics = await LearningAnalytics.findOne({ userId });

    if (!analytics) {
      analytics = await LearningAnalytics.create({
        userId,
        daily: {},
        weekly: {},
        monthly: {},
        conceptMastery: {},
        domainProgress: {},
        lastUpdated: new Date(),
        version: 1,
      });
    }

    return analytics;
  }

  /**
   * Record daily metrics
   */
  static async recordDaily(userId: string, input: RecordDailyAnalyticsInput) {
    const analytics = await this.getOrCreateAnalytics(userId);

    const dateKey = input.date ? input.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const dailyData = {
      date: input.date || new Date(),
      sessionDuration: input.sessionDuration || 0,
      conceptsDiscovered: input.conceptsDiscovered || 0,
      xpEarned: input.xpEarned || 0,
      activities: input.activities || 0,
    };

    const updated = await LearningAnalytics.findOneAndUpdate(
      { userId },
      {
        $set: {
          [`daily.${dateKey}`]: dailyData,
          lastUpdated: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    return updated;
  }

  /**
   * Record concept mastery
   */
  static async recordConceptMastery(userId: string, conceptId: string, input: RecordConceptMasteryInput) {
    const analytics = await this.getOrCreateAnalytics(userId);

    const conceptData = {
      mastery: input.mastery,
      firstLearned: new Date(),
      lastPracticed: new Date(),
      practiceCount: input.practiceCount || 1,
    };

    await LearningAnalytics.findOneAndUpdate(
      { userId },
      {
        $set: {
          [`conceptMastery.${conceptId}`]: conceptData,
          lastUpdated: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    return analytics;
  }

  /**
   * Get concept mastery
   */
  static async getConceptMastery(userId: string, conceptId: string) {
    const analytics = await this.getOrCreateAnalytics(userId);
    const mastery = analytics.conceptMastery.get(conceptId);

    if (!mastery) {
      return { mastery: 0, firstLearned: null, lastPracticed: null, practiceCount: 0 };
    }

    return mastery;
  }

  /**
   * Update domain progress
   */
  static async updateDomainProgress(userId: string, domain: string, progress: number, conceptsCount: number, masteredCount: number) {
    const analytics = await this.getOrCreateAnalytics(userId);

    await LearningAnalytics.findOneAndUpdate(
      { userId },
      {
        $set: {
          [`domainProgress.${domain}`]: {
            progress,
            conceptsCount,
            masteredCount,
            lastAccessed: new Date(),
          },
          lastUpdated: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    return analytics;
  }

  /**
   * Get user learning patterns
   */
  static async getLearningPatterns(userId: string) {
    const analytics = await this.getOrCreateAnalytics(userId);

    const conceptMastery = analytics.conceptMastery;
    const masteryScores = Array.from(conceptMastery.values()).map((c) => c.mastery);

    const avgMastery = masteryScores.length > 0
      ? Math.round(masteryScores.reduce((a, b) => a + b, 0) / masteryScores.length)
      : 0;

    const totalPractice = Array.from(conceptMastery.values())
      .reduce((sum, c) => sum + (c.practiceCount || 0), 0);

    return {
      averageMastery: avgMastery,
      totalPracticeSessions: totalPractice,
      masteredConceptCount: masteryScores.filter((s) => s >= 80).length,
      learningRate: masteryScores.length > 0 ? Math.round(avgMastery / masteryScores.length) : 0,
    };
  }

  /**
   * Get dashboard summary
   */
  static async getDashboardSummary(userId: string) {
    const analytics = await this.getOrCreateAnalytics(userId);

    const dailyKeys = Array.from(analytics.daily.keys()).sort().slice(-7);
    const weeklyKeys = Array.from(analytics.weekly.keys()).sort().slice(-4);
    const monthlyKeys = Array.from(analytics.monthly.keys()).sort().slice(-6);

    return {
      recentDaily: dailyKeys.map((k) => analytics.daily.get(k)),
      recentWeekly: weeklyKeys.map((k) => analytics.weekly.get(k)),
      recentMonthly: monthlyKeys.map((k) => analytics.monthly.get(k)),
      conceptMasteryCount: analytics.conceptMastery.size,
      domainProgressCount: analytics.domainProgress.size,
    };
  }
}