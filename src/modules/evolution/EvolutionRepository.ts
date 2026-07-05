import { User } from '@/database/models/user';
import { UserProgress } from '@/database/models/user-progress';
import { EvolutionLog } from '@/database/models/evolution-log';
import mongoose from 'mongoose';
import type { IUser, IUserProgress } from '@/types';

export class EvolutionRepository {
  static async findUserWithSession(userId: string, session?: mongoose.ClientSession) {
    return await User.findById(userId).session(session || null);
  }

  static async findUserProgressWithSession(userId: string, session?: mongoose.ClientSession) {
    return await UserProgress.findOne({ userId }).session(session || null);
  }

  static async aggregateUserProgress(userId: string, session?: mongoose.ClientSession) {
    return await UserProgress.aggregate(
      [
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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
      ],
      { session }
    );
  }

  static async findLeaderboard(limit = 100) {
    return await User.find({}, { username: 1, totalXP: 1, rank: 1, avatar: 1 })
      .sort({ totalXP: -1 })
      .limit(limit)
      .lean();
  }

  static async createEvolutionLog(log: any, session?: mongoose.ClientSession) {
    return await EvolutionLog.create([log], { session });
  }

  static async updateUser(userId: string, updates: Partial<IUser>, session?: mongoose.ClientSession) {
    return await User.findByIdAndUpdate(userId, updates, { new: true, session });
  }

  static async updateUserProgress(userId: string, updates: Partial<IUserProgress>, session?: mongoose.ClientSession) {
    return await UserProgress.findOneAndUpdate(
      { userId },
      updates,
      { upsert: true, new: true, session }
    );
  }
}

export default EvolutionRepository;