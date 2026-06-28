/**
 * Evolution Service
 * User progression, XP tracking, and rank management
 */

import { User } from '@/database/models/user';
import { UserProgress } from '@/database/models/user-progress';
import { EvolutionLog } from '@/database/models/evolution-log';
import { AppError } from '@/types';
import mongoose from 'mongoose';

export class EvolutionService {
  /**
   * Add XP to user
   */
  static async addXP(
    userId: string,
    amount: number,
    domain: string,
    reason: string = 'General XP Gain',
    metadata?: Record<string, unknown>,
    session?: mongoose.ClientSession
  ) {
    if (amount < 0) {
      throw new AppError(400, 'XP amount must be positive', 'INVALID_XP');
    }

    const user = await User.findById(userId).session(session || null);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const previousRank = user.rank;

    // Add XP
    user.totalXP += amount;

    // Update rank based on total XP
    user.rank = typeof user.calculateRank === 'function' ? user.calculateRank() : user.rank;
    const isRankUp = previousRank !== user.rank;

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

    if (session) {
      await user.save({ session });
      await EvolutionLog.create(
        [
          {
            userId,
            type: 'XP_GAIN',
            xp: amount,
            reason,
            metadata: metadata || { domain },
          },
        ],
        { session }
      );

      if (isRankUp) {
        await EvolutionLog.create(
          [
            {
              userId,
              type: 'RANK_UP',
              xp: 0,
              reason: `Promoted to ${user.rank}`,
              metadata: { previousRank, newRank: user.rank },
            },
          ],
          { session }
        );
      }
    } else {
      await user.save();

      // Log XP
      await EvolutionLog.create({
        userId,
        type: 'XP_GAIN',
        xp: amount,
        reason,
        metadata: metadata || { domain },
      });

      if (isRankUp) {
        await EvolutionLog.create({
          userId,
          type: 'RANK_UP',
          xp: 0,
          reason: `Promoted to ${user.rank}`,
          metadata: { previousRank, newRank: user.rank },
        });
      }
    }

    return { user, isRankUp, addedXp: amount };
  }

  /**
   * Update streak
   */
  static async updateStreak(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Normalize dates to handle streak
    const lastActive = new Date(user.lastActiveDate);
    const today = new Date();
    const lastActiveDay = new Date(Date.UTC(lastActive.getUTCFullYear(), lastActive.getUTCMonth(), lastActive.getUTCDate()));
    const todayDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    
    const daysDiff = Math.floor((todayDay.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24));

    // Increment streak if active today or yesterday
    if (daysDiff === 1) {
      user.streak++;
      await EvolutionLog.create({
        userId,
        type: 'STREAK_UPDATE',
        xp: 0,
        reason: 'Daily streak continued',
        metadata: { newStreak: user.streak }
      });
    } else if (daysDiff > 1) {
      // Reset streak
      user.streak = 1;
      await EvolutionLog.create({
        userId,
        type: 'STREAK_UPDATE',
        xp: 0,
        reason: 'Streak reset',
        metadata: { newStreak: 1 }
      });
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

  /**
   * Get recent evolution logs
   */
  static async getLogs(userId: string, limit = 20) {
    return await EvolutionLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}
