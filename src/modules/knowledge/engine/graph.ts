/**
 * Cognitive Knowledge Graph representation
 */

import { ConceptNode, ConceptRelation, ScoredEdge } from '../types';
import { RelationScorer } from '../scoring/calculator';

export class KnowledgeGraph {
  private nodes: Map<string, ConceptNode> = new Map();
  private relations: ConceptRelation[] = [];
  
  // Adjacency lists for fast lookup
  private forwardAdjacency: Map<string, ScoredEdge[]> = new Map();
  private backwardAdjacency: Map<string, ScoredEdge[]> = new Map();

  // Cache systems
  private shortestPathCache: Map<string, string[]> = new Map();

  constructor(nodesList: ConceptNode[], relationsList: ConceptRelation[]) {
    this.initialize(nodesList, relationsList);
  }

  /**
   * Initializes the graph from concept nodes and relations
   */
  public initialize(nodesList: ConceptNode[], relationsList: ConceptRelation[]) {
    this.nodes.clear();
    this.relations = [...relationsList];
    this.forwardAdjacency.clear();
    this.backwardAdjacency.clear();
    this.shortestPathCache.clear();

    // Index all nodes
    for (const node of nodesList) {
      this.nodes.set(node.id, node);
      this.forwardAdjacency.set(node.id, []);
      this.backwardAdjacency.set(node.id, []);
    }

    // Populate adjacency lists with calculated scores
    for (const rel of this.relations) {
      if (!this.nodes.has(rel.sourceId) || !this.nodes.has(rel.targetId)) {
        continue; // skip relations with missing nodes
      }

      // Forward direction
      const forwardDistance = RelationScorer.calculateSemanticDistance(rel.strength, rel.confidence);
      const forwardWeight = RelationScorer.calculateTraversalWeight(rel, 'forward');
      const forwardEdge: ScoredEdge = {
        source: rel.sourceId,
        target: rel.targetId,
        type: rel.type,
        strength: rel.strength,
        confidence: rel.confidence,
        semanticDistance: forwardDistance,
        traversalWeight: forwardWeight
      };
      this.forwardAdjacency.get(rel.sourceId)!.push(forwardEdge);

      // Backward direction (reverse traversal cost)
      const backwardDistance = RelationScorer.calculateSemanticDistance(rel.strength, rel.confidence);
      const backwardWeight = RelationScorer.calculateTraversalWeight(rel, 'backward');
      const backwardEdge: ScoredEdge = {
        source: rel.targetId,
        target: rel.sourceId,
        type: rel.type,
        strength: rel.strength,
        confidence: rel.confidence,
        semanticDistance: backwardDistance,
        traversalWeight: backwardWeight
      };
      this.backwardAdjacency.get(rel.targetId)!.push(backwardEdge);
    }
  }

  public getNodes(): ConceptNode[] {
    return Array.from(this.nodes.values());
  }

  public getNode(id: string): ConceptNode | undefined {
    return this.nodes.get(id);
  }

  public getRelations(): ConceptRelation[] {
    return this.relations;
  }

  public getOutgoingEdges(nodeId: string): ScoredEdge[] {
    return this.forwardAdjacency.get(nodeId) || [];
  }

  public getIncomingEdges(nodeId: string): ScoredEdge[] {
    return this.backwardAdjacency.get(nodeId) || [];
  }

  /**
   * Caching shortest path queries
   */
  public getCachedPath(startId: string, endId: string): string[] | undefined {
    const key = `${startId}->${endId}`;
    return this.shortestPathCache.get(key);
  }

  public setCachedPath(startId: string, endId: string, path: string[]) {
    const key = `${startId}->${endId}`;
    this.shortestPathCache.set(key, path);
  }
}
