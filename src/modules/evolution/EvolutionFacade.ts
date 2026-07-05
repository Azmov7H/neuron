import { XPService } from './xp.service';
import { StreakService } from './streak.service';
import { StatsService } from './stats.service';
import { LeaderboardService } from './leaderboard.service';
import mongoose from 'mongoose';
import { eventBus, DomainEventType } from '@/lib/events/event-bus';

export class EvolutionFacade {
  /**
   * Add XP to user (orchestrates XP and streak updates)
   */
  static async addXP(
    userId: string,
    amount: number,
    domain: string,
    reason: string = 'General XP Gain',
    metadata?: Record<string, unknown>,
    session?: mongoose.ClientSession
  ) {
    const { user, isRankUp, addedXp } = await XPService.addXP(userId, amount, domain, reason, metadata, session);
    
    // Update streak when gaining XP
    const userWithStreak = await StreakService.updateStreak(userId);
    
    // Emit event for external subscribers
    await eventBus.publish(DomainEventType.UserEarnedXP, {
      userId,
      amount: addedXp,
      domain,
      reason,
      metadata,
    });
    
    if (isRankUp) {
      await eventBus.publish(DomainEventType.UserEarnedXP, {
        userId,
        amount: addedXp,
        domain,
        reason: 'Rank up!',
        metadata: { isRankUp: true },
      });
    }
    
    return { user: userWithStreak, isRankUp, addedXp };
  }

  /**
   * Update streak independently
   */
  static async updateStreak(userId: string) {
    return await StreakService.updateStreak(userId);
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string) {
    return await StatsService.getUserStats(userId);
  }

  /**
   * Get leaderboard
   */
  static async getLeaderboard(limit = 100) {
    return await LeaderboardService.getLeaderboard(limit);
  }

  /**
   * Get recent evolution logs
   */
  static async getLogs(userId: string, limit = 20) {
    return await LeaderboardService.getLogs(userId, limit);
  }
}

// Maintain backward compatibility
export const EvolutionService = EvolutionFacade;