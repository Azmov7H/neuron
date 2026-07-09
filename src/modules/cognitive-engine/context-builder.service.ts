import { CognitiveProfileService } from './cognitive-profile.service';
import { UserMemoryService } from './user-memory.service';
import { LearningTimelineService } from './learning-timeline.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { AnalyticsService } from './analytics.service';
import { Discovery } from '@/database/models/discovery';
import { Recommendation } from '@/database/models/recommendation';

export interface UnifiedContext {
  user: {
    id: string;
  };
  profile: {
    learningStyle: {
      visual: number;
      reading: number;
      simulation: number;
      practical: number;
      theory: number;
    };
    attention: {
      focusDuration: number;
      attentionSpan: number;
      peakFocusHours: number[];
    };
    retention: {
      shortTerm: number;
      mediumTerm: number;
      longTerm: number;
    };
    curiosity: number;
    explorationRate: number;
    problemSolving: number;
    learningSpeed: number;
    strongDomains: string[];
    weakDomains: string[];
    masteredConcepts: string[];
    recentConcepts: string[];
    confidenceScore: number;
    masteryScore: number;
  };
  memory: {
    currentLearningGoal: string;
    currentPathId: string | null;
    currentChapterId: string | null;
    preferredExplanationStyle: string;
    knowledgeGaps: string[];
    recentInteractions: Array<{
      type: string;
      targetId: string;
      timestamp: Date;
      duration: number;
      outcome: string;
    }>;
  };
  timeline: {
    overallProgress: number;
    currentFocus: string;
    domains: string[];
  };
  graph: {
    totalNodes: number;
    totalEdges: number;
    domains: string[];
  };
  discoveries: Array<{
    concept: string;
    domain: string;
    importance: number;
    firstDiscovered: Date;
  }>;
  recommendations: Array<{
    type: string;
    targetId: string;
    targetTitle: string;
    reason: string;
    relevanceScore: number;
  }>;
  analytics: {
    learningPatterns: {
      averageMastery: number;
      totalPracticeSessions: number;
      masteredConceptCount: number;
    };
    daily: Array<{
      date: Date;
      sessionDuration: number;
      conceptsDiscovered: number;
      xpEarned: number;
    }>;
  };
}

export class ContextBuilderService {
  /**
   * Build unified context for AI requests
   */
  static async buildContext(userId: string, options: {
    includeProfile?: boolean;
    includeMemory?: boolean;
    includeTimeline?: boolean;
    includeGraph?: boolean;
    includeAnalytics?: boolean;
    currentPathId?: string;
    currentChapterId?: string;
    recentDiscoveries?: number;
    recommendations?: number;
  } = {}): Promise<UnifiedContext> {
    const {
      includeProfile = true,
      includeMemory = true,
      includeTimeline = true,
      includeGraph = true,
      includeAnalytics = true,
      currentPathId,
      currentChapterId,
      recentDiscoveries = 10,
      recommendations = 5,
    } = options;

    const [profile, memory, timeline, graph, discoveries, recommendationDocs, analytics] = await Promise.all([
      includeProfile ? CognitiveProfileService.getOrCreateProfile(userId) : null,
      includeMemory ? UserMemoryService.getOrCreateMemory(userId) : null,
      includeTimeline ? LearningTimelineService.getOrCreateTimeline(userId) : null,
      includeGraph ? KnowledgeGraphService.getOrCreateGraph(userId) : null,
      includeProfile ? Discovery.find({ userId }).sort({ discoveredAt: -1 }).limit(recentDiscoveries).lean() : [],
      recommendations > 0 ? Recommendation.find({ userId, clicked: false }).sort({ relevanceScore: -1 }).limit(recommendations).lean() : [],
      includeAnalytics ? AnalyticsService.getOrCreateAnalytics(userId) : null,
    ]);

    const context: UnifiedContext = {
      user: { id: userId },
      profile: {
        learningStyle: {
          visual: profile?.learningStyle?.visual ?? 50,
          reading: profile?.learningStyle?.reading ?? 50,
          simulation: profile?.learningStyle?.simulation ?? 50,
          practical: profile?.learningStyle?.practical ?? 50,
          theory: profile?.learningStyle?.theory ?? 50,
        },
        attention: {
          focusDuration: profile?.attention?.focusDuration ?? 25,
          attentionSpan: profile?.attention?.attentionSpan ?? 50,
          peakFocusHours: profile?.attention?.peakFocusHours ?? [9, 14, 19],
        },
        retention: {
          shortTerm: profile?.retention?.shortTerm ?? 50,
          mediumTerm: profile?.retention?.mediumTerm ?? 50,
          longTerm: profile?.retention?.longTerm ?? 50,
        },
        curiosity: profile?.curiosity ?? 50,
        explorationRate: profile?.explorationRate ?? 50,
        problemSolving: profile?.problemSolving ?? 50,
        learningSpeed: profile?.learningSpeed ?? 50,
        strongDomains: profile?.strongDomains ?? [],
        weakDomains: profile?.weakDomains ?? [],
        masteredConcepts: profile?.masteredConcepts ?? [],
        recentConcepts: profile?.recentConcepts ?? [],
        confidenceScore: profile?.confidenceScore ?? 50,
        masteryScore: profile?.masteryScore ?? 0,
      },
      memory: {
        currentLearningGoal: memory?.currentLearningGoal || '',
        currentPathId: memory?.currentPathId?.toString() || null,
        currentChapterId: memory?.currentChapterId || null,
        preferredExplanationStyle: memory?.preferredExplanationStyle || 'text',
        knowledgeGaps: memory?.knowledgeGaps ?? [],
        recentInteractions: (memory?.interactionHistory || []).slice(-10).map((i: { type: string; targetId: string; timestamp: Date; duration: number; outcome: string }) => ({
          type: i.type,
          targetId: i.targetId,
          timestamp: i.timestamp,
          duration: i.duration,
          outcome: i.outcome,
        })),
      },
      timeline: {
        overallProgress: timeline?.overallProgress ?? 0,
        currentFocus: timeline?.currentFocus ?? '',
        domains: timeline ? Array.from(timeline.domains.keys()) : [],
      },
      graph: {
        totalNodes: graph?.nodes.size ?? 0,
        totalEdges: graph?.edges.length ?? 0,
        domains: graph ? Array.from(graph.domains.keys()) : [],
      },
      discoveries: discoveries.map((d: { concept: string; domain: string; importance: number; firstDiscovered: Date }) => ({
        concept: d.concept,
        domain: d.domain,
        importance: d.importance,
        firstDiscovered: d.firstDiscovered,
      })),
      recommendations: recommendationDocs.map((r: { type: string; targetId: string; targetTitle: string; reason: string; relevanceScore: number }) => ({
        type: r.type,
        targetId: r.targetId,
        targetTitle: r.targetTitle,
        reason: r.reason,
        relevanceScore: r.relevanceScore,
      })),
      analytics: {
        learningPatterns: includeAnalytics ? await AnalyticsService.getLearningPatterns(userId) : { averageMastery: 0, totalPracticeSessions: 0, masteredConceptCount: 0 },
        daily: [],
      },
    };

    // Set current context
    if (currentPathId) {
      context.memory.currentPathId = currentPathId;
    }
    if (currentChapterId) {
      context.memory.currentChapterId = currentChapterId;
    }

    // Add daily analytics
    if (includeAnalytics && analytics) {
      const dailyKeys = Array.from(analytics.daily.keys()).sort().slice(-7);
      context.analytics.daily = dailyKeys
        .map((k) => analytics!.daily.get(k))
        .filter((x): x is NonNullable<typeof x> => x !== undefined);
    }

    return context;
  }

  /**
   * Build prompt context for AI
   */
  static async buildPromptContext(userId: string, params: {
    domain?: string;
    currentPathId?: string;
    currentChapterId?: string;
    recentConcepts?: number;
    includeRecommendations?: boolean;
  }) {
    const context = await this.buildContext(userId, {
      currentPathId: params.currentPathId,
      currentChapterId: params.currentChapterId,
    });

    const userContext = {
      profile: context.profile,
      memory: context.memory,
    };

    const promptContext: Record<string, unknown> = {
      user: userContext,
      knowledge: {
        graph: context.graph,
        timeline: context.timeline,
      },
      analytics: context.analytics,
    };

    return promptContext;
  }

  /**
   * Build context for Spark AI prompt
   */
  static async buildSparkContext(userId: string, domain?: string, pathId?: string, chapterId?: string) {
    const context = await this.buildContext(userId, {
      currentPathId: pathId,
      currentChapterId: chapterId,
    });

    if (domain) {
      context.timeline.currentFocus = domain;
    }

    return context;
  }

  /**
   * Format context for LLM prompt
   */
  static formatForPrompt(context: UnifiedContext): string {
    return `
User Context:
- Learning Style: Visual(${context.profile.learningStyle.visual}%), Reading(${context.profile.learningStyle.reading}%), Simulation(${context.profile.learningStyle.simulation}%), Practical(${context.profile.learningStyle.practical}%), Theory(${context.profile.learningStyle.theory}%)
- Attention: Focus Duration ${context.profile.attention.focusDuration}min, Attention Span ${context.profile.attention.attentionSpan}%
- Retention: Short-term ${context.profile.retention.shortTerm}%, Medium-term ${context.profile.retention.mediumTerm}%, Long-term ${context.profile.retention.longTerm}%
- Curiosity: ${context.profile.curiosity}%, Exploration Rate: ${context.profile.explorationRate}%
- Strong Domains: ${context.profile.strongDomains.join(', ') || 'None'}
- Weak Domains: ${context.profile.weakDomains.join(', ') || 'None'}
- Mastered Concepts: ${context.profile.masteredConcepts.length}
- Recent Concepts: ${context.profile.recentConcepts.slice(0, 5).join(', ')}
- Confidence Score: ${context.profile.confidenceScore}%, Mastery Score: ${context.profile.masteryScore}%

Current State:
- Learning Goal: ${context.memory.currentLearningGoal || 'Not set'}
- Current Path: ${context.memory.currentPathId || 'None'}
- Current Chapter: ${context.memory.currentChapterId || 'None'}
- Knowledge Gaps: ${context.memory.knowledgeGaps.join(', ') || 'None'}
- Preferred Explanation Style: ${context.memory.preferredExplanationStyle}

Progress:
- Overall Progress: ${context.timeline.overallProgress}%
- Current Focus: ${context.timeline.currentFocus || 'General'}
- Domains: ${context.timeline.domains.join(', ')}

Recent Discoveries:
${context.discoveries.slice(0, 5).map((d) => `- ${d.concept} (${d.domain}): ${d.importance}% important`).join('\n')}

Recommendations:
${context.recommendations.slice(0, 3).map((r) => `- ${r.targetTitle}: ${r.reason}`).join('\n')}
`.trim();
  }
}