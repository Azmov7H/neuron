import { KnowledgeGraph } from '@/database/models/knowledge-graph';
import { AddKnowledgeNodeInput, AddEdgeInput } from '@/validations/schemas';

export class KnowledgeGraphService {
  /**
   * Get or create knowledge graph for user
   */
  static async getOrCreateGraph(userId: string) {
    let graph = await KnowledgeGraph.findOne({ userId });

    if (!graph) {
      graph = await KnowledgeGraph.create({
        userId,
        nodes: {},
        edges: [],
        domains: {},
        lastUpdated: new Date(),
        version: 1,
      });
    }

    return graph;
  }

  /**
   * Add concept node to graph
   */
  static async addConceptNode(userId: string, input: AddKnowledgeNodeInput) {
    const graph = await this.getOrCreateGraph(userId);

    const node = {
      conceptId: input.conceptId,
      title: input.title,
      domain: input.domain,
      difficulty: input.difficulty || 'beginner',
      importance: input.importance || 50,
      prerequisites: input.prerequisites || [],
      relatedConcepts: input.relatedConcepts || [],
      applications: input.applications || [],
      historicalContext: input.historicalContext || [],
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

    const domainData = graph.domains.get(input.domain) || { conceptIds: [], centrality: 0 };
    if (!domainData.conceptIds.includes(input.conceptId)) {
      domainData.conceptIds.push(input.conceptId);
    }
    graph.domains.set(input.domain, domainData);

    graph.lastUpdated = new Date();
    graph.version = (graph.version || 1) + 1;

    await graph.save();
    return graph;
  }

  /**
   * Add edge between concepts
   */
  static async addEdge(userId: string, input: AddEdgeInput) {
    const graph = await this.getOrCreateGraph(userId);

    const edge = {
      source: input.source,
      target: input.target,
      type: input.type,
      weight: input.weight ?? 0.5,
    };

    graph.edges.push(edge);
    graph.lastUpdated = new Date();
    graph.version = (graph.version || 1) + 1;

    await graph.save();
    return graph;
  }

  /**
   * Get node by concept ID
   */
  static async getNode(userId: string, conceptId: string) {
    const graph = await this.getOrCreateGraph(userId);
    const node = graph.nodes.get(conceptId);

    if (!node) {
      return null;
    }

    const relatedNodes = await this.getRelatedNodes(userId, conceptId);

    return {
      ...node,
      relatedNodes,
    };
  }

  /**
   * Get related concepts
   */
  static async getRelatedNodes(userId: string, conceptId: string) {
    const graph = await this.getOrCreateGraph(userId);
    const node = graph.nodes.get(conceptId);

    if (!node) {
      return [];
    }

    const relatedIds = node.relatedConcepts;
    const nodes = [];

    for (const id of relatedIds) {
      const relatedNode = graph.nodes.get(id);
      if (relatedNode) {
        const edge = graph.edges.find(
          (e) => (e.source === conceptId && e.target === id) || (e.source === id && e.target === conceptId)
        );
        nodes.push({
          ...relatedNode,
          connectionType: edge?.type,
          connectionWeight: edge?.weight,
        });
      }
    }

    return nodes;
  }

  /**
   * Get domain concepts
   */
  static async getDomainConcepts(userId: string, domain: string) {
    const graph = await this.getOrCreateGraph(userId);
    const domainData = graph.domains.get(domain);

    if (!domainData) {
      return [];
    }

    const nodes = [];
    for (const conceptId of domainData.conceptIds) {
      const node = graph.nodes.get(conceptId);
      if (node) {
        nodes.push(node);
      }
    }

    return nodes;
  }

  /**
   * Update node resources
   */
  static async updateResources(
    userId: string,
    conceptId: string,
    resources: {
      articles?: string[];
      videos?: string[];
      simulations?: string[];
      papers?: string[];
      equations?: string[];
      visualizations?: string[];
    }
  ) {
    const graph = await this.getOrCreateGraph(userId);
    const node = graph.nodes.get(conceptId);

    if (!node) {
      throw new Error(`Node ${conceptId} not found`);
    }

    Object.assign(node.resources, resources);
    node.updatedAt = new Date();
    graph.lastUpdated = new Date();

    await graph.save();
    return graph;
  }
}