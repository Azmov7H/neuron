/**
 * XP Service
 * Domain service for managing XP rewards, domain progression levels, and student promotions.
 */

import { EvolutionRepository } from './EvolutionRepository';
import { AppError } from '@/types';
import mongoose from 'mongoose';

export class XPService {
  /**
   * Add XP to student profile. Updates ranks and logs transaction record.
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

    const user = await EvolutionRepository.findUserWithSession(userId, session);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const previousRank = user.rank;

    // Add XP
    user.totalXP += amount;

    // Update rank based on total XP
    if (typeof user.calculateRank === 'function') {
      user.rank = user.calculateRank();
    }
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
      const userObj = user.toObject();
      const updateData = { ...userObj, _id: userObj._id.toString() };
      await EvolutionRepository.updateUser(userId, updateData, session);
      await EvolutionRepository.createEvolutionLog(
        {
          userId,
          type: 'XP_GAIN',
          xp: amount,
          reason,
          metadata: metadata || { domain },
        },
        session
      );

      if (isRankUp) {
        await EvolutionRepository.createEvolutionLog(
          {
            userId,
            type: 'RANK_UP',
            xp: 0,
            reason: `Promoted to ${user.rank}`,
            metadata: { previousRank, newRank: user.rank },
          },
          session
        );
      }
    } else {
      await user.save();

      // Log XP
      await EvolutionRepository.createEvolutionLog({
        userId,
        type: 'XP_GAIN',
        xp: amount,
        reason,
        metadata: metadata || { domain },
      });

      if (isRankUp) {
        await EvolutionRepository.createEvolutionLog({
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
}
