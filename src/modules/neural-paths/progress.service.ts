/**
 * Progress Tracking Service
 * Monitor and analyze user learning progress
 */

import { UserProgress } from '@/database/models/user-progress';
import { NeuralPath } from '@/database/models/neural-path';
import { AppError } from '@/types';

export class ProgressService {
  /**
   * Get user's active learning paths
   */
  static async getActivePaths(userId: string) {
    const progress = await UserProgress.find(
      { userId, completedAt: null },
      { pathId: 1, overallCompletion: 1, lastAccessedAt: 1 }
    )
      .sort({ lastAccessedAt: -1 })
      .lean();

    return progress;
  }

  /**
   * Get learning statistics
   */
  static async getLearningStats(userId: string) {
    const stats = await UserProgress.aggregate([
      { $match: { userId: { $eq: userId } } },
      {
        $group: {
          _id: null,
          totalPaths: { $sum: 1 },
          completedPaths: {
            $sum: { $cond: [{ $ne: ['$completedAt', null] }, 1, 0] },
          },
          totalTimeMinutes: { $sum: { $divide: ['$timeSpent', 60] } },
          averageCompletion: { $avg: '$overallCompletion' },
          averageTimePerPath: { $avg: { $divide: ['$timeSpent', 60] } },
          totalXP: { $sum: '$xpEarned' },
        },
      },
    ]);

    return stats[0] || {
      totalPaths: 0,
      completedPaths: 0,
      totalTimeMinutes: 0,
      averageCompletion: 0,
      averageTimePerPath: 0,
      totalXP: 0,
    };
  }

  /**
   * Calculate time estimate for remaining content
   */
  static async estimateTimeRemaining(userId: string, pathId: string) {
    const progress = await UserProgress.findOne({ userId, pathId });

    if (!progress) {
      throw new AppError(404, 'Progress not found', 'PROGRESS_NOT_FOUND');
    }

    const path = await NeuralPath.findById(pathId);

    if (!path) {
      throw new AppError(404, 'Path not found', 'PATH_NOT_FOUND');
    }

    // Calculate based on user's average pace
    const userStats = await this.getLearningStats(userId);
    const avgTimePerPath = userStats.averageTimePerPath || path.estimatedTime;

    const remainingPercent = 100 - progress.overallCompletion;
    const estimatedMinutes = Math.round((remainingPercent / 100) * avgTimePerPath);

    return {
      estimatedMinutes,
      remainingPercent,
      estimatedCompletion: new Date(Date.now() + estimatedMinutes * 60 * 1000),
    };
  }

  /**
   * Analyze learning patterns
   */
  static async analyzeLearningPatterns(userId: string) {
    const progressData = await UserProgress.find({ userId }).lean();

    if (progressData.length === 0) {
      return null;
    }

    // Calculate average session duration
    const totalTime = progressData.reduce((sum, p) => sum + p.timeSpent, 0);
    const avgSessionDuration = Math.round(totalTime / progressData.length / 60); // minutes

    // Calculate consistency
    const completedPaths = progressData.filter((p) => p.completedAt).length;
    const completionRate = Math.round((completedPaths / progressData.length) * 100);

    // Identify preferred learning pace
    const timeDiffs = progressData
      .map((p) => p.timeSpent / 60) // convert to minutes
      .filter((t) => t > 0);

    const avgPace = Math.round(timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length);

    return {
      averageSessionDuration: avgSessionDuration,
      completionRate,
      preferredPace: avgPace > 120 ? 'deep' : avgPace > 60 ? 'moderate' : 'quick',
      totalPathsStarted: progressData.length,
      totalPathsCompleted: completedPaths,
    };
  }
}
