/**
 * Evolution Service
 * User progression, XP tracking, and rank management
 */

import { User } from '@/database/models/user';
import { UserProgress } from '@/database/models/user-progress';
import { AppError } from '@/types';

export class EvolutionService {
  /**
   * Add XP to user
   */
  static async addXP(userId: string, amount: number, domain: string) {
    if (amount < 0) {
      throw new AppError(400, 'XP amount must be positive', 'INVALID_XP');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Add XP
    user.totalXP += amount;

    // Update rank based on total XP
    user.rank = user.calculateRank();

    // Update domain-specific XP
    const domainIndex = user.domains.findIndex((d) => d.domain === domain);
    if (domainIndex >= 0) {
      user.domains[domainIndex].xp += amount;
      user.domains[domainIndex].level = Math.floor(user.domains[domainIndex].xp / 1000);
    } else {
      user.domains.push({
        domain,
        xp: amount,
        level: 0,
        mastery: 0,
        lastAccessed: new Date(),
        pathsCompleted: 0,
        conceptsDiscovered: 0,
      });
    }

    await user.save();
    return user;
  }

  /**
   * Update streak
   */
  static async updateStreak(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const lastActive = new Date(user.lastActiveDate);
    const today = new Date();
    const diff = today.getTime() - lastActive.getTime();
    const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Increment streak if active today or yesterday
    if (daysDiff <= 1) {
      user.streak++;
    } else {
      // Reset streak
      user.streak = 1;
    }

    user.lastActiveDate = new Date();
    await user.save();
    return user;
  }

  /**
   * Get user statistics
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

  /**
   * Get leaderboard
   */
  static async getLeaderboard(limit = 100) {
    const leaderboard = await User.find({}, { username: 1, totalXP: 1, rank: 1, avatar: 1 })
      .sort({ totalXP: -1 })
      .limit(limit)
      .lean();

    return leaderboard;
  }
}
