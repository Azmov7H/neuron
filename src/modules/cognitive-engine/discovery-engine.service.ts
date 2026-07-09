import { Discovery } from '@/database/models/discovery';
import { KnowledgeGraph } from '@/database/models/knowledge-graph';
import { CognitiveProfile } from '@/database/models/cognitive-profile';
import { User } from '@/database/models/user';
import { RecordDiscoveryInput } from '@/validations/schemas';
import { IKnowledgeNode } from '@/types/cognitive';

export class DiscoveryEngineService {
  /**
   * Record a new discovery
   */
  static async recordDiscovery(userId: string, input: RecordDiscoveryInput) {
    const discovery = await Discovery.create({
      userId,
      conceptId: input.conceptId,
      concept: input.concept,
      domain: input.domain,
      relatedConcepts: input.relatedConcepts || [],
      importance: input.importance || 50,
      context: {
        sourcePathId: input.sourcePathId,
      },
      userInterest: input.userInterest || 50,
      discoveredAt: new Date(),
    });

    // Update user's recent concepts
    await this.updateUserRecentConcepts(userId, input.concept);

    // Update knowledge graph
    await this.updateKnowledgeGraph(userId, input);

    // Update cognitive profile
    await this.updateCognitiveProfileConcepts(userId, input.concept);

    return discovery;
  }

  /**
   * Get user's discoveries
   */
  static async getUserDiscoveries(userId: string, options: {
    domain?: string;
    limit?: number;
    sortBy?: 'discoveredAt' | 'importance' | 'userInterest';
    sortOrder?: 1 | -1;
  } = {}) {
    const { domain, limit = 50, sortBy = 'discoveredAt', sortOrder = -1 } = options;

    const query: Record<string, unknown> = { userId };
    if (domain) query.domain = domain;

    return Discovery.find(query)
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .lean();
  }

  /**
   * Calculate importance score
   * Based on: time since discovery, revisit count, user engagement, domain rarity
   */
  static async calculateImportanceScore(userId: string, conceptId: string) {
    const discovery = await Discovery.findOne({ userId, conceptId });
    if (!discovery) return 50;

    // Base importance from discovery count
    const discoveryCount = await Discovery.countDocuments({ conceptId });
    const rarityScore = Math.max(10, 100 - discoveryCount * 2);

    // Time decay factor
    const daysSinceDiscovery = (Date.now() - discovery.discoveredAt.getTime()) / (1000 * 60 * 60 * 24);
    const timeFactor = Math.max(0.5, 1 - daysSinceDiscovery / 365);

    // User interest factor
    const interestFactor = discovery.userInterest / 100;

    const importance = Math.round(
      discovery.importance * 0.4 +
      rarityScore * 0.3 +
      timeFactor * 100 * 0.2 +
      interestFactor * 100 * 0.1
    );

    await Discovery.findOneAndUpdate(
      { userId, conceptId },
      { $set: { importance } }
    );

    return Math.min(100, importance);
  }

  /**
   * Get related concepts
   */
  static async getRelatedConcepts(userId: string, conceptId: string, limit = 10) {
    const discovery = await Discovery.findOne({ userId, conceptId });
    if (!discovery) return [];

    const relatedIds = discovery.relatedConcepts || [];

    const related = await Discovery.find({
      userId,
      conceptId: { $in: relatedIds },
    }).limit(limit);

    return related;
  }

  /**
   * Re-discover a concept (update revisit count)
   */
  static async reDiscover(userId: string, conceptId: string) {
    const discovery = await Discovery.findOne({ userId, conceptId });
    if (!discovery) return null;

    await Discovery.findOneAndUpdate(
      { userId, conceptId },
      {
        $set: { lastRevisited: new Date() },
        $inc: { revisitCount: 1 },
      }
    );

    return discovery;
  }

  /**
   * Get concept network (graph of related concepts)
   */
  static async getConceptNetwork(userId: string, conceptId: string, depth = 2) {
    const graph = await KnowledgeGraph.findOne({ userId });
    if (!graph) return { nodes: [], edges: [] };

    const node = graph.nodes.get(conceptId);
    if (!node) return { nodes: [], edges: [] };

    const nodes = [node];
    const edges: Array<{ source: string; target: string; type: string; weight: number }> = [];

    // Get direct relationships
    const directRelated = node.relatedConcepts || [];
    for (const relatedId of directRelated) {
      const relatedNode = graph.nodes.get(relatedId);
      if (relatedNode) {
        nodes.push(relatedNode);
        edges.push({
          source: conceptId,
          target: relatedId,
          type: 'related',
          weight: 0.5,
        });
      }
    }

    return { nodes, edges };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Update user's recent concepts list
   */
  private static async updateUserRecentConcepts(userId: string, concept: string) {
    const user = await User.findById(userId);
    if (!user) return;

    const concepts = user.discoveredConcepts || [];
    if (!concepts.includes(concept)) {
      concepts.push(concept);
      if (concepts.length > 100) {
        concepts.shift();
      }
    }

    await User.findByIdAndUpdate(userId, { $set: { discoveredConcepts: concepts } });
  }

  /**
   * Update knowledge graph with new discovery
   */
  private static async updateKnowledgeGraph(userId: string, input: RecordDiscoveryInput) {
    const graph = await KnowledgeGraph.findOne({ userId }) ||
      await KnowledgeGraph.create({
        userId,
        nodes: {},
        edges: [],
        domains: {},
        lastUpdated: new Date(),
        version: 1,
      });

    // Add node if not exists
    if (!graph.nodes.get(input.conceptId)) {
      const node: IKnowledgeNode = {
        conceptId: input.conceptId,
        title: input.concept,
        domain: input.domain,
        difficulty: 'beginner',
        importance: input.importance || 50,
        prerequisites: [],
        relatedConcepts: input.relatedConcepts || [],
        applications: [],
        historicalContext: [],
        resources: {
          articles: [],
          videos: [],
          simulations: [],
          papers: [],
          equations: [],
          visualizations: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };

      graph.nodes.set(input.conceptId, node);
    }

    // Add edges for related concepts
    for (const relatedId of (input.relatedConcepts || [])) {
      if (!graph.edges.some((e: { source: string; target: string }) =>
        (e.source === input.conceptId && e.target === relatedId) ||
        (e.source === relatedId && e.target === input.conceptId)
      )) {
        graph.edges.push({
          source: input.conceptId,
          target: relatedId,
          type: 'related',
          weight: 0.5,
        });
      }
    }

    // Update domain
    const domainData = graph.domains.get(input.domain) || { conceptIds: [], centrality: 0 };
    if (!domainData.conceptIds.includes(input.conceptId)) {
      domainData.conceptIds.push(input.conceptId);
    }
    graph.domains.set(input.domain, domainData);

    graph.lastUpdated = new Date();
    graph.version = (graph.version || 1) + 1;

    await graph.save();
  }

  /**
   * Update cognitive profile with new concepts
   */
  private static async updateCognitiveProfileConcepts(userId: string, concept: string) {
    const profile = await CognitiveProfile.findOne({ userId });
    if (!profile) return;

    const recentConcepts = profile.recentConcepts || [];
    if (!recentConcepts.includes(concept)) {
      recentConcepts.push(concept);
      if (recentConcepts.length > 50) {
        recentConcepts.shift();
      }
    }

    await CognitiveProfile.findOneAndUpdate(
      { userId },
      { $set: { recentConcepts, lastUpdated: new Date() } }
    );
  }

  /**
   * Get discovery statistics for user
   */
  static async getDiscoveryStats(userId: string) {
    const totalDiscoveries = await Discovery.countDocuments({ userId });
    const domainStats = await Discovery.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const recentDiscoveries = await Discovery.find({ userId })
      .sort({ discoveredAt: -1 })
      .limit(5)
      .select('concept domain importance discoveredAt');

    return {
      totalDiscoveries,
      domainStats,
      recentDiscoveries,
    };
  }
}