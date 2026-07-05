/**
 * Streak Service
 * Domain service for managing consecutive daily learning streaks.
 */

import { User } from '@/database/models/user';
import { EvolutionLog } from '@/database/models/evolution-log';
import { AppError } from '@/types';

export class StreakService {
  /**
   * Evaluates active streak status based on last active timestamp.
   */
  static async updateStreak(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const lastActive = new Date(user.lastActiveDate);
    const today = new Date();
    const lastActiveDay = new Date(Date.UTC(lastActive.getUTCFullYear(), lastActive.getUTCMonth(), lastActive.getUTCDate()));
    const todayDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    
    const daysDiff = Math.floor((todayDay.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24));

    // Daily activity increment or reset
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
}
