/**
 * Conversation Repository
 * Handles database operations for Spark Session aggregate roots.
 */

import { SparkSession } from '@/database/models/spark-session';
import { Types } from 'mongoose';
import { SparkMessage } from '@/types';

export class ConversationRepository {
  /**
   * Find session by ID.
   */
  static async findById(id: string) {
    return await SparkSession.findById(id);
  }

  /**
   * Find sessions by user ID.
   */
  static async findByUserId(userId: string, limit = 10) {
    return await SparkSession.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Find latest session for user in a domain.
   */
  static async findOneLatest(userId: string, domain: string) {
    return await SparkSession.findOne({
      userId: new Types.ObjectId(userId),
      domain: domain.toLowerCase(),
    }).sort({ createdAt: -1 });
  }

  /**
   * Create a new session.
   */
  static async create(
    userId: string,
    domain: string,
    contextData?: { currentPathId?: string; currentChapterId?: string; userLevel?: number }
  ) {
    const session = new SparkSession({
      userId: new Types.ObjectId(userId),
      domain,
      context: {
        currentPathId: contextData?.currentPathId ? new Types.ObjectId(contextData.currentPathId) : undefined,
        currentChapterId: contextData?.currentChapterId,
        userLevel: contextData?.userLevel || 0,
        recentConcepts: [],
      },
    });
    await session.save();
    return session;
  }

  /**
   * Add a message to session and save it.
   */
  static async addMessage(
    session: any,
    role: 'user' | 'assistant',
    content: string,
    metadata?: SparkMessage['metadata']
  ) {
    session.addMessage(role, content, metadata);
    await session.save();
    return session;
  }

  /**
   * Save session document.
   */
  static async save(session: any) {
    return await session.save();
  }
}
