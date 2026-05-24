/**
 * Unified Knowledge Engine Service (Facade Pattern)
 */

import { nodes as staticNodes, edges as staticEdges, MatrixNode } from '@/lib/matrix-data';
import { KnowledgeGraph } from './engine/graph';
import { TraversalSolver } from './traversal/solver';
import { ConceptClusterer } from './clustering/clusterer';
import { RecommendationEngine } from './recommendations/engine';
import {
  ConceptNode,
  ConceptRelation,
  RelationType,
  UserCognitiveProfile,
  RecommendationPayload,
  ConceptCluster,
  LearningGap
} from './types';

export class KnowledgeEngineService {
  private static instance: KnowledgeEngineService | null = null;
  private graph: KnowledgeGraph;

  private constructor() {
    this.graph = this.buildGraphFromStaticData();
  }

  /**
   * Singleton accessor
   */
  public static getInstance(): KnowledgeEngineService {
    if (!this.instance) {
      this.instance = new KnowledgeEngineService();
    }
    return this.instance;
  }

  /**
   * Get reference to the raw knowledge graph
   */
  public getGraph(): KnowledgeGraph {
    return this.graph;
  }

  /**
   * Refreshes the graph, e.g. when database changes or new data is loaded
   */
  public refreshGraph(nodes: ConceptNode[], relations: ConceptRelation[]) {
    this.graph.initialize(nodes, relations);
  }

  /**
   * Find the shortest learning path (Dijkstra) between two concepts
   */
  public findShortestPath(startId: string, endId: string): string[] {
    return TraversalSolver.findShortestPath(this.graph, startId, endId);
  }

  /**
   * Resolve prerequisite chain for a concept
   */
  public getPrerequisites(conceptId: string): string[] {
    return TraversalSolver.getPrerequisiteChain(this.graph, conceptId);
  }

  /**
   * Get progressive learning chain (prereqs -> concept -> followups)
   */
  public getProgressiveChain(conceptId: string): string[] {
    return TraversalSolver.getProgressiveLearningChain(this.graph, conceptId);
  }

  /**
   * Group concepts into domain-centric clusters
   */
  public getDomainClusters(): ConceptCluster[] {
    return ConceptClusterer.clusterByDomain(this.graph);
  }

  /**
   * Group concepts into highly connected semantic clusters
   */
  public getSemanticClusters(): ConceptCluster[] {
    return ConceptClusterer.findSemanticClusters(this.graph);
  }

  /**
   * Detect learning gaps (missing prerequisites) for a user profile
   */
  public detectLearningGaps(profile: UserCognitiveProfile): LearningGap[] {
    return RecommendationEngine.detectLearningGaps(this.graph, profile);
  }

  /**
   * Generate personalized next-concept learning recommendations
   */
  public getRecommendations(profile: UserCognitiveProfile, limit = 3): RecommendationPayload[] {
    return RecommendationEngine.generateNextConcepts(this.graph, profile, limit);
  }

  /**
   * Helper to transform legacy/static matrix data into the semantic schema
   */
  private buildGraphFromStaticData(): KnowledgeGraph {
    const nodes: ConceptNode[] = staticNodes.map((n) => {
      // Map domain string safely to types
      const difficulty: ConceptNode['difficulty'] =
        n.layer === 1 ? 'beginner' : n.layer === 2 ? 'intermediate' : 'advanced';

      return {
        id: n.id,
        title: n.title,
        domain: n.domain,
        layer: n.layer,
        importance: n.importance,
        description: n.description,
        difficulty,
        tags: [n.domain.toLowerCase()],
        parentId: n.parentId,
        activationFrequency: n.activationFrequency,
        position: n.position
      };
    });

    const relations: ConceptRelation[] = [];

    for (const edge of staticEdges) {
      const sourceNode = staticNodes.find((n) => n.id === edge.source);
      const targetNode = staticNodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) continue;

      // Determine relation type intelligently
      let type: RelationType = 'similarity';

      if (sourceNode.parentId === targetNode.id) {
        // Target is parent, meaning source needs target (target is prerequisite of source)
        type = 'prerequisite';
      } else if (targetNode.parentId === sourceNode.id) {
        // Source is parent, meaning target needs source (source is prerequisite of target)
        type = 'prerequisite';
      } else if (sourceNode.domain !== targetNode.domain) {
        type = 'interdisciplinary';
      } else if (sourceNode.domain === 'Mathematics' || sourceNode.domain === 'Physics') {
        type = 'mathematical_dependency';
      } else {
        type = 'conceptual_overlap';
      }

      // Convert strength (1-3) to a float (0.0 to 1.0)
      const strength = edge.strength / 3.0;

      relations.push({
        sourceId: edge.source,
        targetId: edge.target,
        type,
        strength,
        confidence: 0.95 // default confidence for static curated connections
      });
    }

    return new KnowledgeGraph(nodes, relations);
  }
}
