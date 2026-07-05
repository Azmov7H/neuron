/**
 * Stats Service
 * Domain service for aggregating student learning metrics and curriculum stats.
 */

import { User } from '@/database/models/user';
import { UserProgress } from '@/database/models/user-progress';
import { AppError } from '@/types';

export class StatsService {
  /**
   * Aggregates stats from user progress logs.
   */
  static async getUserStats(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const progress = await UserProgress.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalPathsStarted: { $sum: 1 },
          totalPathsCompleted: {
            $sum: { $cond: [{ $eq: ['$completedAt', null] }, 0, 1] },
          },
          totalTimeSpent: { $sum: '$timeSpent' },
          averageCompletion: { $avg: '$overallCompletion' },
        },
      },
    ]);

    return {
      user: {
        username: user.username,
        rank: user.rank,
        totalXP: user.totalXP,
        streak: user.streak,
        domains: user.domains,
      },
      stats: progress[0] || {
        totalPathsStarted: 0,
        totalPathsCompleted: 0,
        totalTimeSpent: 0,
        averageCompletion: 0,
      },
    };
  }
}
