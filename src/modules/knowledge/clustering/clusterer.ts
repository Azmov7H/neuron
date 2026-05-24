/**
 * Concept Clusterer
 */

import { KnowledgeGraph } from '../engine/graph';
import { ConceptCluster } from '../types';

export class ConceptClusterer {
  /**
   * Group concepts by their domain.
   * Central concept is selected as the one with highest activationFrequency & importance = 1.
   */
  static clusterByDomain(graph: KnowledgeGraph): ConceptCluster[] {
    const nodes = graph.getNodes();
    const domainsMap: Map<string, string[]> = new Map();

    for (const node of nodes) {
      if (!domainsMap.has(node.domain)) {
        domainsMap.set(node.domain, []);
      }
      domainsMap.get(node.domain)!.push(node.id);
    }

    const clusters: ConceptCluster[] = [];

    for (const [domain, conceptIds] of domainsMap.entries()) {
      // Find central concept (highest baseline activation frequency in importance 1)
      let centralConceptId = conceptIds[0];
      let maxScore = -1;

      for (const id of conceptIds) {
        const node = graph.getNode(id);
        if (node) {
          const score = (node.importance === 1 ? 5 : 1) * node.activationFrequency;
          if (score > maxScore) {
            maxScore = score;
            centralConceptId = id;
          }
        }
      }

      clusters.push({
        id: `domain-${domain.toLowerCase()}`,
        name: `${domain} core`,
        domain,
        conceptIds,
        centralConceptId
      });
    }

    return clusters;
  }

  /**
   * Identifies semantic clusters of highly connected concepts.
   * Clusters concepts around importance-1 nodes using strong relations.
   */
  static findSemanticClusters(graph: KnowledgeGraph): ConceptCluster[] {
    const nodes = graph.getNodes();
    const coreNodes = nodes.filter(n => n.importance === 1);
    const clusters: ConceptCluster[] = [];

    for (const core of coreNodes) {
      const conceptIds = new Set<string>([core.id]);
      const outgoing = graph.getOutgoingEdges(core.id);

      for (const edge of outgoing) {
        // Group nodes with strength >= 0.5 (or connection Strengths >= 2/3)
        if (edge.strength >= 0.5) {
          conceptIds.add(edge.target);
        }
      }

      clusters.push({
        id: `semantic-${core.id}`,
        name: `${core.title} cluster`,
        domain: core.domain,
        conceptIds: Array.from(conceptIds),
        centralConceptId: core.id
      });
    }

    return clusters;
  }
}
