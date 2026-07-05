/**
 * Leaderboard Service
 * Domain service for leaderboard retrieval and progression history logs.
 */

import { User } from '@/database/models/user';
import { EvolutionLog } from '@/database/models/evolution-log';

export class LeaderboardService {
  /**
   * Fetch top ranked student profiles.
   */
  static async getLeaderboard(limit = 100) {
    return await User.find({}, { username: 1, totalXP: 1, rank: 1, avatar: 1 })
      .sort({ totalXP: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Fetch recent evolution logs for a student.
   */
  static async getLogs(userId: string, limit = 20) {
    return await EvolutionLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}
