/**
 * Traversal Solver for the Knowledge Graph
 */

import { KnowledgeGraph } from '../engine/graph';
import { ConceptNode } from '../types';

export class TraversalSolver {
  /**
   * Find shortest path between two nodes using Dijkstra's algorithm based on edge traversalWeights.
   */
  static findShortestPath(graph: KnowledgeGraph, startId: string, endId: string): string[] {
    // Check cache first
    const cached = graph.getCachedPath(startId, endId);
    if (cached) return cached;

    const nodes = graph.getNodes();
    const nodeIds = nodes.map(n => n.id);

    if (!nodeIds.includes(startId) || !nodeIds.includes(endId)) {
      return [];
    }

    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const unvisited = new Set<string>();

    for (const nodeId of nodeIds) {
      distances[nodeId] = Infinity;
      previous[nodeId] = null;
      unvisited.add(nodeId);
    }

    distances[startId] = 0;

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let currentId: string | null = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          currentId = nodeId;
        }
      }

      if (currentId === null || currentId === endId) {
        break; // reached target or disconnected
      }

      unvisited.delete(currentId);

      // Explore neighbors
      const outgoingEdges = graph.getOutgoingEdges(currentId);
      for (const edge of outgoingEdges) {
        if (!unvisited.has(edge.target)) continue;

        const alt = distances[currentId] + edge.traversalWeight;
        if (alt < distances[edge.target]) {
          distances[edge.target] = alt;
          previous[edge.target] = currentId;
        }
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let curr: string | null = endId;

    if (distances[endId] === Infinity) {
      // No path found
      return [];
    }

    while (curr !== null) {
      path.unshift(curr);
      curr = previous[curr];
    }

    // Save to cache
    graph.setCachedPath(startId, endId, path);
    return path;
  }

  /**
   * Recursively resolves the complete prerequisite chain for a concept.
   * Prevents cycles using a visited set.
   */
  static getPrerequisiteChain(graph: KnowledgeGraph, conceptId: string, visited = new Set<string>()): string[] {
    if (visited.has(conceptId)) return [];
    visited.add(conceptId);

    const prerequisites: string[] = [];
    const incomingEdges = graph.getIncomingEdges(conceptId);

    for (const edge of incomingEdges) {
      if (edge.type === 'prerequisite' || edge.type === 'mathematical_dependency') {
        const parentChain = this.getPrerequisiteChain(graph, edge.source, visited);
        prerequisites.push(...parentChain);
        if (!prerequisites.includes(edge.source)) {
          prerequisites.push(edge.source);
        }
      }
    }

    return prerequisites;
  }

  /**
   * Expands the domain outward from core concepts up to maxDepth.
   */
  static getDomainExpansion(graph: KnowledgeGraph, domain: string, maxDepth = 2): string[] {
    const domainNodes = graph.getNodes().filter(n => n.domain.toLowerCase() === domain.toLowerCase());
    const coreNodes = domainNodes.filter(n => n.importance === 1);
    
    const results = new Set<string>(coreNodes.map(n => n.id));
    let currentFrontier = [...results];

    for (let depth = 0; depth < maxDepth; depth++) {
      const nextFrontier: string[] = [];
      for (const nodeId of currentFrontier) {
        const edges = graph.getOutgoingEdges(nodeId);
        for (const edge of edges) {
          const targetNode = graph.getNode(edge.target);
          if (targetNode && !results.has(targetNode.id)) {
            results.add(targetNode.id);
            nextFrontier.push(targetNode.id);
          }
        }
      }
      currentFrontier = nextFrontier;
    }

    return Array.from(results);
  }

  /**
   * Generates a progressive learning chain: prereqs -> primary -> followups
   */
  static getProgressiveLearningChain(graph: KnowledgeGraph, conceptId: string): string[] {
    const node = graph.getNode(conceptId);
    if (!node) return [];

    const prereqs = this.getPrerequisiteChain(graph, conceptId);
    
    // Find immediate outgoing dependencies (nodes that require this concept)
    const followups: string[] = [];
    const outgoing = graph.getOutgoingEdges(conceptId);
    
    for (const edge of outgoing) {
      if (edge.type === 'prerequisite' || edge.type === 'mathematical_dependency') {
        followups.push(edge.target);
      }
    }

    return [...prereqs, conceptId, ...followups];
  }
}
