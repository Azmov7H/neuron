/**
 * Spark AI Service Adapter
 * Acts as a backward-compatibility layer pointing to the upgraded modular SparkService.
 */

import { SparkService } from '@/modules/spark/spark.service';
import { SparkSession } from '@/database/models/spark-session';

export class SparkAIService {
  static async createSession(
    userId: string,
    domain: string,
    contextData?: { currentPathId?: string; currentChapterId?: string }
  ) {
    return SparkService.createSession(userId, domain, contextData);
  }

  static async sendMessage(
    sessionId: string,
    userId: string,
    content: string,
    metadata?: { intent?: string; entities?: string[] }
  ) {
    // For backward-compatibility non-streaming calls, prepare and complete normally
    await SparkService.prepareLLMRequest(sessionId, userId, content);
    
    // We can join or simulate response (or in mock/prod fallback)
    const mockResponse = 
      "I am Spark, your educational mentor. Please use the upgraded streaming endpoint /api/spark/chat for real-time interactions!";
    
    await SparkService.saveAssistantResponse(sessionId, userId, mockResponse);
    
    // Return the updated session model
    const updatedSession = await SparkSession.findById(sessionId);
    if (!updatedSession) {
      throw new Error('Session not found after update');
    }
    return updatedSession;
  }

  static async getSessionHistory(sessionId: string, userId: string) {
    return SparkService.getSessionHistory(sessionId, userId);
  }

  static async getUserSessions(userId: string, limit = 10) {
    return SparkService.getUserSessions(userId, limit);
  }

  static async generateInsights(sessionId: string) {
    return SparkService.generateInsights(sessionId);
  }

  static async storeInteraction(userId: string, domain: string, concept: string) {
    let session = await SparkSession.findOne({ userId, domain }).sort({ createdAt: -1 });
    if (!session) {
      session = await SparkService.createSession(userId, domain);
    }
    
    if (session.context) {
      if (!session.context.recentConcepts) {
        session.context.recentConcepts = [];
      }
      if (!session.context.recentConcepts.includes(concept)) {
        session.context.recentConcepts.push(concept);
        if (session.context.recentConcepts.length > 15) {
          session.context.recentConcepts.shift();
        }
        await session.save();
      }
    }
    return session;
  }

  static async getUserContext(userId: string, domain: string) {
    const session = await SparkSession.findOne({ userId, domain }).sort({ createdAt: -1 });
    return session ? session.context : null;
  }
}
