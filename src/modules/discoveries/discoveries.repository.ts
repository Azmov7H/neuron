/**
 * Discovery Repository
 * Encapsulates Mongoose database calls for concept discoveries.
 */

import { Discovery } from '@/database/models/discovery';
import { User } from '@/database/models/user';
import { Types } from 'mongoose';

export class DiscoveryRepository {
  /**
   * Find user discovery by concept slug
   */
  static async findByConceptId(userId: string, conceptId: string) {
    return await Discovery.findOne({
      userId: new Types.ObjectId(userId),
      conceptId,
    });
  }

  /**
   * Create a new concept discovery
   */
  static async create(data: {
    userId: string;
    conceptId: string;
    concept: string;
    domain: string;
    importance: number;
    context?: {
      fromSparkSession?: string;
      sourcePathId?: string;
      sourceChapterId?: string;
    };
    userInterest: number;
  }) {
    const discovery = new Discovery({
      userId: new Types.ObjectId(data.userId),
      conceptId: data.conceptId,
      concept: data.concept,
      domain: data.domain.toLowerCase(),
      importance: data.importance,
      context: data.context ? {
        fromSparkSession: data.context.fromSparkSession ? new Types.ObjectId(data.context.fromSparkSession) : undefined,
        sourcePathId: data.context.sourcePathId ? new Types.ObjectId(data.context.sourcePathId) : undefined,
        sourceChapterId: data.context.sourceChapterId,
      } : undefined,
      userInterest: data.userInterest,
    });
    await discovery.save();
    return discovery;
  }

  /**
   * Add the concept title to the user's list of discovered concepts
   */
  static async addToUserProfile(userId: string, conceptTitle: string) {
    return await User.findByIdAndUpdate(new Types.ObjectId(userId), {
      $addToSet: { discoveredConcepts: conceptTitle },
    });
  }

  /**
   * Find all discoveries logged for a user
   */
  static async findUserDiscoveries(userId: string) {
    return await Discovery.find({ userId: new Types.ObjectId(userId) });
  }
}
