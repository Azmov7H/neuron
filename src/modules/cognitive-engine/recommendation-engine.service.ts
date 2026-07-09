import { Recommendation } from '@/database/models/recommendation';
import { Types } from 'mongoose';
import { CognitiveProfile } from '@/database/models/cognitive-profile';
import { UserMemory } from '@/database/models/user-memory';
import { Discovery } from '@/database/models/discovery';
import { NeuralPath } from '@/database/models/neural-path';
import { LearningTimeline } from '@/database/models/learning-timeline';
import { KnowledgeGraph } from '@/database/models/knowledge-graph';
import { SimulationRun } from '@/database/models/simulation-run';

export interface RecommendationInput {
  userId: string;
  type: 'concept' | 'path' | 'simulation' | 'research';
  limit?: number;
}

export class RecommendationEngineService {
  /**
   * Generate recommendations for user
   */
  static async generateRecommendations(userId: string, type: 'concept' | 'path' | 'simulation' | 'research' = 'path', limit = 10) {
    // Clear old recommendations
    await Recommendation.deleteMany({ userId, expiresAt: { $lt: new Date() } });

    let recommendations: Array<{
      targetId: string;
      targetTitle: string;
      reason: string;
      relevanceScore: number;
      confidenceScore: number;
      metadata: Record<string, unknown>;
    }> = [];

    switch (type) {
      case 'path':
        recommendations = await this.generatePathRecommendations(userId, limit);
        break;
      case 'concept':
        recommendations = await this.generateConceptRecommendations(userId, limit);
        break;
      case 'simulation':
        recommendations = await this.generateSimulationRecommendations(userId, limit);
        break;
      case 'research':
        recommendations = await this.generateResearchRecommendations(userId, limit);
        break;
    }

    // Save recommendations
    const savedRecommendations = await Recommendation.create(
      recommendations.map((r) => ({
        userId,
        type,
        targetId: r.targetId,
        targetTitle: r.targetTitle,
        reason: r.reason,
        relevanceScore: r.relevanceScore,
        confidenceScore: r.confidenceScore,
        metadata: r.metadata,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        viewed: false,
        clicked: false,
      }))
    );

    return savedRecommendations;
  }

  /**
   * Generate path recommendations
   */
  private static async generatePathRecommendations(userId: string, limit: number) {
    const [profile, memory, timeline] = await Promise.all([
      CognitiveProfile.findOne({ userId }),
      UserMemory.findOne({ userId }),
      LearningTimeline.findOne({ userId }),
    ]);

    const recommendations = [];

    // Get weak domains
    const weakDomains = profile?.weakDomains || [];
    const masteredConcepts = profile?.masteredConcepts || [];

    // Find paths in weak domains
    for (const domain of weakDomains) {
      const paths = await NeuralPath.find({
        domain,
        isActive: true,
        _id: { $nin: memory?.currentPathId ? [new Types.ObjectId(memory.currentPathId)] : [] },
      }).limit(5);

      for (const path of paths) {
        const reason = `Recommended to strengthen your ${domain} knowledge`;
        const relevanceScore = this.calculatePathRelevance(path, profile, memory);

        recommendations.push({
          targetId: path._id.toString(),
          targetTitle: path.title,
          reason,
          relevanceScore,
          confidenceScore: 0.8,
          metadata: { domain, difficulty: path.difficulty },
        });
      }
    }

    // Get next logical paths from timeline
    if (timeline?.currentFocus) {
      const nextPaths = await NeuralPath.find({
        domain: timeline.currentFocus,
        isActive: true,
      }).limit(3);

      for (const path of nextPaths) {
        const exists = recommendations.some((r) => r.targetId === path._id.toString());
        if (!exists) {
          recommendations.push({
            targetId: path._id.toString(),
            targetTitle: path.title,
            reason: `Continue your journey in ${timeline.currentFocus}`,
            relevanceScore: 0.7,
            confidenceScore: 0.9,
            metadata: { domain: timeline.currentFocus, difficulty: path.difficulty },
          });
        }
      }
    }

    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Generate concept recommendations
   */
  private static async generateConceptRecommendations(userId: string, limit: number) {
    const [profile, memory, graph] = await Promise.all([
      CognitiveProfile.findOne({ userId }),
      UserMemory.findOne({ userId }),
      KnowledgeGraph.findOne({ userId }),
    ]);

    const recommendations = [];
    const weakDomains = profile?.weakDomains || [];
    const mastered = new Set(profile?.masteredConcepts || []);

    // Get concepts from weak domains
    for (const domain of weakDomains) {
      const domainData = graph?.domains.get(domain);
      if (domainData?.conceptIds) {
        for (const conceptId of domainData.conceptIds) {
          if (!mastered.has(conceptId)) {
            const node = graph?.nodes.get(conceptId);
            if (node) {
              recommendations.push({
                targetId: conceptId,
                targetTitle: node.title,
                reason: `Practice ${node.title} to strengthen ${domain} knowledge`,
                relevanceScore: node.importance / 100,
                confidenceScore: 0.75,
                metadata: { domain, prerequisiteCount: node.prerequisites?.length || 0 },
              });
            }
          }
        }
      }
    }

    // Get related concepts from recent discoveries
    const recentDiscoveries = await Discovery.find({ userId })
      .sort({ discoveredAt: -1 })
      .limit(5);

    for (const discovery of recentDiscoveries) {
      for (const relatedId of (discovery.relatedConcepts || [])) {
        const relatedNode = graph?.nodes.get(relatedId);
        if (relatedNode && !mastered.has(relatedId)) {
          recommendations.push({
            targetId: relatedId,
            targetTitle: relatedNode.title,
            reason: `Explore ${relatedNode.title}, related to ${discovery.concept}`,
            relevanceScore: 0.6,
            confidenceScore: 0.7,
            metadata: { domain: relatedNode.domain, basedOn: discovery.concept },
          });
        }
      }
    }

    return recommendations
      .filter((r, index, self) => index === self.findIndex((item) => item.targetId === r.targetId))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Generate simulation recommendations
   */
  private static async generateSimulationRecommendations(userId: string, limit: number) {
    const [profile, memory] = await Promise.all([
      CognitiveProfile.findOne({ userId }),
      UserMemory.findOne({ userId }),
    ]);

    const recommendations = [];
    const weakDomains = profile?.weakDomains || [];

    // Find simulations in weak domains
    const simulationPaths = await NeuralPath.find({
      domain: { $in: weakDomains },
      'chapters.resources': { $regex: /simulation/i },
    }).limit(10);

    for (const path of simulationPaths) {
      const simChapter = path.chapters.find((c: { resources: string[] }) =>
        c.resources.some((r: string) => r.includes('simulation'))
      );

      if (simChapter) {
        recommendations.push({
          targetId: `${path._id}-simulation`,
          targetTitle: `${path.title}: ${simChapter.title}`,
          reason: `Practice ${simChapter.title} with hands-on simulation`,
          relevanceScore: 0.8,
          confidenceScore: 0.85,
          metadata: { domain: path.domain, pathId: path._id.toString() },
        });
      }
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Generate research recommendations
   */
  private static async generateResearchRecommendations(userId: string, limit: number) {
    const [profile, memory] = await Promise.all([
      CognitiveProfile.findOne({ userId }),
      UserMemory.findOne({ userId }),
    ]);

    const recommendations = [];
    const interests = memory?.longTermInterests || [];
    const weakDomains = profile?.weakDomains || [];

    // Recommend research based on interests and weak domains
    const researchTopics = [...interests, ...weakDomains];

    for (const topic of researchTopics) {
      recommendations.push({
        targetId: `research-${topic}`,
        targetTitle: `${topic} Research Papers`,
        reason: `Deep dive into ${topic} with academic research`,
        relevanceScore: 0.75,
        confidenceScore: 0.7,
        metadata: { topic, type: 'research-paper' },
      });
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Calculate path relevance score
   */
  private static calculatePathRelevance(
    path: { difficulty: string; domain: string; chapters: { duration: number }[] },
    profile: InstanceType<typeof CognitiveProfile> | null,
    memory: InstanceType<typeof UserMemory> | null
  ) {
    let score = 0.5;

    // Difficulty match
    const difficulty = profile?.preferredDifficulty || 'adaptive';
    if (difficulty === 'adaptive') {
      score += 0.2;
    } else if (path.difficulty === difficulty) {
      score += 0.3;
    }

    // Domain match
    const weakDomains = profile?.weakDomains || [];
    if (weakDomains.includes(path.domain)) {
      score += 0.3;
    }

    // Time estimation
    const totalTime = path.chapters.reduce((sum: number, ch: { duration: number }) => sum + (ch.duration || 0), 0);
    const focusDuration = profile?.attention?.focusDuration || 25;
    if (totalTime / 60 <= focusDuration) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  /**
   * Get user's recommendations
   */
  static async getUserRecommendations(userId: string, type?: string, limit = 20) {
    const query: Record<string, unknown> = { userId };
    if (type) query.type = type;

    return Recommendation.find(query)
      .sort({ relevanceScore: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Mark recommendation as viewed
   */
  static async markViewed(userId: string, recommendationId: string) {
    return Recommendation.findOneAndUpdate(
      { _id: new Types.ObjectId(recommendationId), userId },
      { $set: { viewed: true } },
      { new: true }
    );
  }

  /**
   * Mark recommendation as clicked
   */
  static async markClicked(userId: string, recommendationId: string) {
    return Recommendation.findOneAndUpdate(
      { _id: new Types.ObjectId(recommendationId), userId },
      { $set: { clicked: true } },
      { new: true }
    );
  }

  /**
   * Get recommendation insights
   */
  static async getRecommendationInsights(userId: string) {
    const stats = await Recommendation.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          clicked: { $sum: { $cond: ['$clicked', 1, 0] } },
          viewed: { $sum: { $cond: ['$viewed', 1, 0] } },
        },
      },
    ]);

    return stats.map((s) => ({
      type: s._id,
      total: s.total,
      clickRate: s.total > 0 ? s.clicked / s.total : 0,
      viewRate: s.total > 0 ? s.viewed / s.total : 0,
    }));
  }
}