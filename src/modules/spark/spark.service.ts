import { ConversationRepository } from './conversation.repository';
import { PromptBuilder } from './prompt.builder';
import { MemoryService } from './memory.service';
import { ResponseParser } from './response-parser.service';
import { SparkContext } from './spark.context';
import { SparkRetrieval } from './spark.retrieval';
import { SparkFallback } from './spark.fallback';
import { DiscoveryService } from '@/modules/discoveries/discoveries.service';
import { XPService } from '@/modules/evolution/xp.service';
import { AppError } from '@/types';
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
    return await ConversationRepository.create(userId, domain, contextData);
  }

  /**
   * Prepares context and format prompt engineering history for OpenRouter LLM stream call
   */
  static async prepareLLMRequest(
    sessionId: string,
    userId: string,
    userMessage: string
  ) {
    const session = await ConversationRepository.findById(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
    }

    if (session.userId.toString() !== userId) {
      throw new AppError(403, 'Unauthorized access to session', 'FORBIDDEN');
    }

    const mode = this.detectResponseMode(userMessage);

    const learningContext = await SparkContext.aggregateContext(
      userId,
      session.domain,
      {
        currentPathId: session.context?.currentPathId?.toString(),
        currentChapterId: session.context?.currentChapterId,
      }
    );

    const retrievedChunks = await SparkRetrieval.retrieveRelevantKnowledge(
      userMessage,
      session.domain,
      3
    );

    const { systemPrompt, contextPrompt } = PromptBuilder.formatPrompt(
      learningContext,
      retrievedChunks,
      session.domain,
      mode
    );

    await ConversationRepository.addMessage(session, 'user', userMessage, {
      intent: 'question',
      concepts: retrievedChunks.map(c => c.title),
    });

    return {
      llmMessages: [
        { role: 'system' as const, content: systemPrompt },
        ...MemoryService.trimHistory(session.messages.slice(0, -1), 8),
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
    const session = await ConversationRepository.findById(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
    }

    const mode = this.detectResponseMode(userMessage);

    const retrievedChunks = await SparkRetrieval.retrieveRelevantKnowledge(
      userMessage,
      session.domain,
      3
    );

    const lastMsg = session.messages[session.messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== userMessage) {
      await ConversationRepository.addMessage(session, 'user', userMessage, {
        intent: 'question',
        concepts: retrievedChunks.map(c => c.title),
      });
    }

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
    const session = await ConversationRepository.findById(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
    }

    const parsed = ResponseParser.parse(assistantMessageRaw);

    await ConversationRepository.addMessage(session, 'assistant', parsed.cleanContent, {
      intent: 'explanation',
      concepts: parsed.conceptsList.map(c => c.title),
    });

    if (session.context) {
      if (!session.context.recentConcepts) {
        session.context.recentConcepts = [];
      }
      parsed.conceptsList.forEach(c => {
        if (!session.context.recentConcepts.includes(c.title)) {
          session.context.recentConcepts.push(c.title);
        }
      });
      if (session.context.recentConcepts.length > 15) {
        session.context.recentConcepts = session.context.recentConcepts.slice(-15);
      }
    }

    await ConversationRepository.save(session);

    // Register discoveries
    if (parsed.conceptsList.length > 0) {
      await DiscoveryService.registerDiscoveriesFromChat(
        userId,
        parsed.conceptsList,
        session._id.toString(),
        session.domain
      );
    }

    // Award XP
    const evoResult = await XPService.addXP(
      userId,
      15,
      session.domain,
      'Spark AI Mentor Conversation',
      { sessionId: session._id }
    );

    return {
      cleanResponse: parsed.cleanContent,
      concepts: parsed.conceptsList,
      simulations: parsed.metadata.relatedSimulations || [],
      followUps: parsed.followUpsList,
      addedXp: evoResult.addedXp,
      isRankUp: evoResult.isRankUp
    };
  }

  /**
   * Get specific session details and history
   */
  static async getSessionHistory(sessionId: string, userId: string) {
    const session = await ConversationRepository.findById(sessionId);
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
    return await ConversationRepository.findByUserId(userId, limit);
  }

  /**
   * Generate session insights on cognitive progress
   */
  static async generateInsights(sessionId: string) {
    const session = await ConversationRepository.findById(sessionId);
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
    await ConversationRepository.save(session);

    return insights;
  }
}
