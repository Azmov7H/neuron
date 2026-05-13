/**
 * Spark AI Service
 * Conversation management and AI context handling
 */

import { SparkSession } from '@/database/models/spark-session';
import { User } from '@/database/models/user';
import { Discovery } from '@/database/models/discovery';
import { AppError } from '@/types';

export class SparkAIService {
  /**
   * Create new spark session
   */
  static async createSession(
    userId: string,
    domain: string,
    contextData?: { currentPathId?: string; currentChapterId?: string }
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const session = new SparkSession({
      userId,
      domain,
      context: {
        currentPathId: contextData?.currentPathId,
        currentChapterId: contextData?.currentChapterId,
        userLevel: user.totalXP,
        recentConcepts: [],
      },
    });

    await session.save();
    return session;
  }

  /**
   * Send message to Spark AI
   * In production, this would integrate with OpenAI or similar
   */
  static async sendMessage(
    sessionId: string,
    userId: string,
    content: string,
    metadata?: { intent?: string; entities?: string[] }
  ) {
    const session = await SparkSession.findById(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
    }

    if (session.userId.toString() !== userId) {
      throw new AppError(403, 'Unauthorized', 'FORBIDDEN');
    }

    // Add user message
    session.addMessage('user', content, metadata);

    // TODO: Call OpenAI API or LLM service
    // For now, return a placeholder response
    const aiResponse =
      'This is where Spark would provide an intelligent response based on your question and learning context.';

    // Add AI response
    session.addMessage('assistant', aiResponse, {
      intent: 'response',
      entities: [],
      concepts: [],
    });

    // Extract concepts from user message for discoveries
    if (metadata?.entities) {
      for (const concept of metadata.entities) {
        // Register discovery
        await Discovery.create({
          userId,
          conceptId: concept,
          concept,
          domain: session.domain,
          context: {
            fromSparkSession: session._id,
          },
          userInterest: 60, // Default interest score
        });
      }
    }

    await session.save();
    return session;
  }

  /**
   * Get session history
   */
  static async getSessionHistory(sessionId: string, userId: string) {
    const session = await SparkSession.findById(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
    }

    if (session.userId.toString() !== userId) {
      throw new AppError(403, 'Unauthorized', 'FORBIDDEN');
    }

    return session;
  }

  /**
   * Get user's spark sessions
   */
  static async getUserSessions(userId: string, limit = 10) {
    const sessions = await SparkSession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return sessions;
  }

  /**
   * Generate session insights
   */
  static async generateInsights(sessionId: string) {
    const session = await SparkSession.findById(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
    }

    const userMessages = session.messages.filter((m) => m.role === 'user');
    const conceptsDiscussed = session.context.recentConcepts;

    // TODO: Implement actual insight generation using LLM
    const insights = {
      misconceptions: [],
      strengths: conceptsDiscussed.slice(0, 3),
      recommendations: ['Continue exploring related concepts', 'Try the Neural Path for this domain'],
    };

    session.insights = insights;
    await session.save();

    return insights;
  }
}
