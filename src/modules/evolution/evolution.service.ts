/**
 * Evolution Service
 * User progression, XP tracking, and rank management
 */

import { User } from '@/database/models/user';
import { UserProgress } from '@/database/models/user-progress';
import { EvolutionLog } from '@/database/models/evolution-log';
import { AppError } from '@/types';
import mongoose from 'mongoose';

import { XPService } from './xp.service';
import { StreakService } from './streak.service';
import { StatsService } from './stats.service';
import { LeaderboardService } from './leaderboard.service';
import mongoose from 'mongoose';

export class EvolutionService {
  /**
   * Add XP to user (facade delegating to XPService)
   */
  static async addXP(
    userId: string,
    amount: number,
    domain: string,
    reason: string = 'General XP Gain',
    metadata?: Record<string, unknown>,
    session?: mongoose.ClientSession
  ) {
    return await XPService.addXP(userId, amount, domain, reason, metadata, session);
  }

  /**
   * Update streak (facade delegating to StreakService)
   */
  static async updateStreak(userId: string) {
    return await StreakService.updateStreak(userId);
  }

  /**
   * Get user statistics (facade delegating to StatsService)
   */
  static async getUserStats(userId: string) {
    return await StatsService.getUserStats(userId);
  }

  /**
   * Get leaderboard (facade delegating to LeaderboardService)
   */
  static async getLeaderboard(limit = 100) {
    return await LeaderboardService.getLeaderboard(limit);
  }

  /**
   * Get recent evolution logs (facade delegating to LeaderboardService)
   */
  static async getLogs(userId: string, limit = 20) {
    return await LeaderboardService.getLogs(userId, limit);
  }
}
