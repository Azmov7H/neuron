/**
 * Spark Service Core
 * Orchestrates educational conversational flow, aggregates learning contexts,
 * performs knowledge retrieval, invokes prompt engineering, awards XP, and logs discoveries.
 * Incorporates automatic response mode detection and strict response governance.
 */

import { SparkSession } from '@/database/models/spark-session';
import { User } from '@/database/models/user';
import { Discovery } from '@/database/models/discovery';
import { EvolutionService } from '@/modules/evolution/evolution.service';
import { SparkContext } from './spark.context';
import { SparkRetrieval } from './spark.retrieval';
import { SparkPrompt } from './spark.prompt';
import { SparkResponseFormatter } from './spark.responseFormatter';
import { SparkFallback } from './spark.fallback';
import { AppError } from '@/types';
import { logger } from '@/lib/logger';
import { Types } from 'mongoose';

export class SparkService {
  /**
   * Helper to automatically determine the educational response mode based on student keywords
   */
  static detectResponseMode(userMessage: string): 'scientific' | 'educational' | 'cinematic' {
    const query = userMessage.toLowerCase();
    
    // Cinematic keywords
    if (
      query.includes('cinematic') ||
      query.includes('story') ||
      query.includes('epic') ||
      query.includes('voyage') ||
      query.includes('space journey') ||
      query.includes('narrative')
    ) {
      return 'cinematic';
    }

    // Scientific keywords
    if (
      query.includes('scientific') ||
      query.includes('equation') ||
      query.includes('formula') ||
      query.includes('math') ||
      query.includes('proof') ||
      query.includes('rigorous') ||
      query.includes('derivation')
    ) {
      return 'scientific';
    }

    return 'educational';
  }

  /**
   * Create a new Spark AI conversation session
   */
  static async createSession(
    userId: string,
    domain: string,
    contextData?: { currentPathId?: string; currentChapterId?: string }
  ) {
    const user = await User.findById(new Types.ObjectId(userId));
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const session = new SparkSession({
      userId: new Types.ObjectId(userId),
      domain,
      context: {
        currentPathId: contextData?.currentPathId ? new Types.ObjectId(contextData.currentPathId) : undefined,
        currentChapterId: contextData?.currentChapterId,
        userLevel: user.totalXP,
        recentConcepts: [],
      },
    });

    await session.save();
    return session;
  }

  /**
   * Prepares context and format prompt engineering history for OpenRouter LLM stream call
   */
  static async prepareLLMRequest(
    sessionId: string,
    userId: string,
    userMessage: string
  ) {
    const session = await SparkSession.findById(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
    }

    if (session.userId.toString() !== userId) {
      throw new AppError(403, 'Unauthorized access to session', 'FORBIDDEN');
    }

    // 1. Automatically detect active mode
    const mode = this.detectResponseMode(userMessage);

    // 2. Gather all learner contexts
    const learningContext = await SparkContext.aggregateContext(
      userId,
      session.domain,
      {
        currentPathId: session.context?.currentPathId?.toString(),
        currentChapterId: session.context?.currentChapterId,
      }
    );

    // 3. Query Knowledge base chunks
    const retrievedChunks = await SparkRetrieval.retrieveRelevantKnowledge(
      userMessage,
      session.domain,
      3
    );

    // 4. Build Personas & Prompts
    const systemPrompt = SparkPrompt.getSystemPrompt(session.domain, mode);
    const contextPrompt = SparkPrompt.buildContextPrompt(learningContext, retrievedChunks);

    // Add user message to local MongoDB session
    session.addMessage('user', userMessage, {
      intent: 'question',
      concepts: retrievedChunks.map(c => c.title),
    });
    await session.save();

    return {
      llmMessages: [
        { role: 'system', content: systemPrompt },
        // Inject prior history (last 8 messages for context memory)
        ...session.messages.slice(0, -1).slice(-8).map(msg => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        })),
        // Inject combined context chunk + current user question
        {
          role: 'user' as const,
          content: `${contextPrompt}\n\n[STUDENT CURRENT QUESTION]: ${userMessage}`
        }
      ],
      session,
      domain: session.domain,
      mode,
      retrievedChunks
    };
  }

  /**
   * Handles offline database lookup and templates generation if AI layer fails
   */
  static async generateLocalFallback(
    sessionId: string,
    userId: string,
    userMessage: string
  ): Promise<string> {
    const session = await SparkSession.findById(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
    }

    // Detect mode from query
    const mode = this.detectResponseMode(userMessage);

    // Retrieve local chunks based on query
    const retrievedChunks = await SparkRetrieval.retrieveRelevantKnowledge(
      userMessage,
      session.domain,
      3
    );

    // Add user message to session if not already appended
    const lastMsg = session.messages[session.messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== userMessage) {
      session.addMessage('user', userMessage, {
        intent: 'question',
        concepts: retrievedChunks.map(c => c.title),
      });
      await session.save();
    }

    // Generate standard Tertiary fallback explanation
    return SparkFallback.generateExplanation(userMessage, session.domain, mode, retrievedChunks);
  }

  /**
   * Post-processes Assistant response stream: extracts concepts, rewards XP, and creates discoveries
   */
  static async saveAssistantResponse(
    sessionId: string,
    userId: string,
    assistantMessageRaw: string
  ) {
    const session = await SparkSession.findById(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
    }

    // 1. Delegate parsing to the strict Response Formatter
    const { cleanContent, metadata, conceptsList, followUpsList } = 
      SparkResponseFormatter.parseResponse(assistantMessageRaw);

    // 2. Add message to local session
    session.addMessage('assistant', cleanContent, {
      intent: 'explanation',
      concepts: conceptsList.map(c => c.title),
    });

    // Update recent concepts discussed in active context memory
    if (session.context) {
      conceptsList.forEach(c => {
        if (!session.context.recentConcepts.includes(c.title)) {
          session.context.recentConcepts.push(c.title);
        }
      });
      // Cap at 15 items
      if (session.context.recentConcepts.length > 15) {
        session.context.recentConcepts = session.context.recentConcepts.slice(-15);
      }
    }

    await session.save();

    // 3. Register discoveries in Explore System (using the dynamically parsed concept list!)
    const userObjectId = new Types.ObjectId(userId);
    for (const concept of conceptsList) {
      try {
        const existingDiscovery = await Discovery.findOne({
          userId: userObjectId,
          conceptId: concept.title.toLowerCase().replace(/\s+/g, '-'),
        });

        if (!existingDiscovery) {
          await Discovery.create({
            userId: userObjectId,
            conceptId: concept.title.toLowerCase().replace(/\s+/g, '-'),
            concept: concept.title,
            domain: concept.domain || session.domain,
            importance: 50,
            context: {
              fromSparkSession: session._id,
              sourcePathId: session.context?.currentPathId,
              sourceChapterId: session.context?.currentChapterId,
            },
            userInterest: 75,
          });

          // Update user level's discovered concepts in their central profile
          await User.findByIdAndUpdate(userObjectId, {
            $addToSet: { discoveredConcepts: concept.title }
          });
        }
      } catch (err) {
        logger.error('[Spark Service] Error creating discovery:', err);
      }
    }

    // 4. Award XP via Evolution Service (15 XP for rich mentoring session)
    let addedXp = 0;
    let isRankUp = false;
    try {
      const evoResult = await EvolutionService.addXP(
        userId,
        15,
        session.domain,
        'Spark AI Mentor Conversation',
        { sessionId: session._id }
      );
      addedXp = evoResult.addedXp;
      isRankUp = evoResult.isRankUp;
    } catch (err) {
      logger.error('[Spark Service] Error adding XP:', err);
    }

    return {
      cleanResponse: cleanContent,
      concepts: conceptsList,
      simulations: metadata.relatedSimulations || [],
      followUps: followUpsList,
      addedXp,
      isRankUp
    };
  }

  /**
   * Get specific session details and history
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
   * Get a list of sessions started by user
   */
  static async getUserSessions(userId: string, limit = 10) {
    return await SparkSession.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Generate session insights on cognitive progress
   */
  static async generateInsights(sessionId: string) {
    const session = await SparkSession.findById(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
    }

    const conceptsDiscussed = session.context?.recentConcepts || [];

    const insights = {
      misconceptions: [],
      strengths: conceptsDiscussed.slice(0, 3),
      recommendations: [
        'Study further related concepts in the Explore section.',
        'Begin a comprehensive learning Path for active mastery.'
      ]
    };

    session.insights = insights;
    await session.save();

    return insights;
  }
}
