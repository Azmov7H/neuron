/**
 * Personalized Adaptive Recommendation Engine
 */

import { KnowledgeGraph } from '../engine/graph';
import { TraversalSolver } from '../traversal/solver';
import { UserCognitiveProfile, RecommendationPayload, LearningGap } from '../types';

export class RecommendationEngine {
  /**
   * Identifies missing prerequisite concepts that the user needs to study first.
   */
  static detectLearningGaps(graph: KnowledgeGraph, profile: UserCognitiveProfile): LearningGap[] {
    const gaps: LearningGap[] = [];
    const completedSet = new Set<string>(profile.completedConcepts);

    // Look at nodes the user hasn't finished, or is actively working on
    const nodes = graph.getNodes();
    for (const node of nodes) {
      if (completedSet.has(node.id)) continue;

      const allPrereqs = TraversalSolver.getPrerequisiteChain(graph, node.id);
      const missingPrereqs = allPrereqs.filter(id => !completedSet.has(id));

      if (missingPrereqs.length > 0) {
        gaps.push({
          conceptId: node.id,
          missingPrerequisiteIds: missingPrereqs
        });
      }
    }

    return gaps;
  }

  /**
   * Generates highly personalized next-concept recommendations
   */
  static generateNextConcepts(
    graph: KnowledgeGraph,
    profile: UserCognitiveProfile,
    limit = 3
  ): RecommendationPayload[] {
    const completedSet = new Set<string>(profile.completedConcepts);
    const recommendations: RecommendationPayload[] = [];
    const nodes = graph.getNodes();

    // 1. Gather all concepts not yet completed
    for (const node of nodes) {
      if (completedSet.has(node.id)) continue;

      // Check if all prerequisites are satisfied
      const allPrereqs = TraversalSolver.getPrerequisiteChain(graph, node.id);
      const missingPrereqs = allPrereqs.filter(id => !completedSet.has(id));
      
      const prereqsMet = missingPrereqs.length === 0;

      // Base relevance score
      let relevanceScore = 0.4;
      let reason = 'Expand your core knowledge base.';

      if (prereqsMet) {
        relevanceScore += 0.2;
        reason = 'All prerequisites are fully satisfied. Ready to master!';
      } else {
        // Lower relevance if prereqs are missing, or suggest studying prereqs instead
        relevanceScore -= 0.15;
        reason = `Prerequisites missing: ${missingPrereqs.slice(0, 2).map(id => graph.getNode(id)?.title || id).join(', ')}.`;
      }

      // Relevance boosts
      const matchesFocus = profile.focusAreas.some(f => f.toLowerCase() === node.domain.toLowerCase() || f.toLowerCase() === node.id.toLowerCase());
      if (matchesFocus) {
        relevanceScore += 0.25;
        reason = `Aligns perfectly with your selected focus area: ${node.domain}.`;
      }

      const matchesStrengths = profile.strengths.some(s => s.toLowerCase() === node.domain.toLowerCase());
      if (matchesStrengths) {
        relevanceScore += 0.1;
        reason = `Leverages your cognitive strengths in ${node.domain}.`;
      }

      const matchesWeakness = profile.weaknesses.some(w => w.toLowerCase() === node.domain.toLowerCase());
      if (matchesWeakness) {
        relevanceScore += 0.15;
        reason = `Recommended to bridge learning gaps and build confidence in ${node.domain}.`;
      }

      // Bound relevance between 0.1 and 1.0
      relevanceScore = Math.max(0.1, Math.min(1.0, relevanceScore));

      // Calculate confidence score based on completeness of related concepts
      const connected = graph.getOutgoingEdges(node.id);
      const completedConnected = connected.filter(edge => completedSet.has(edge.target)).length;
      const confidenceScore = connected.length > 0 ? 0.3 + (completedConnected / connected.length) * 0.7 : 0.5;

      recommendations.push({
        type: 'concept',
        targetId: node.id,
        targetTitle: node.title,
        reason,
        relevanceScore: parseFloat(relevanceScore.toFixed(3)),
        confidenceScore: parseFloat(confidenceScore.toFixed(3))
      });
    }

    // Sort by relevance score desc, then confidence score desc
    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore || b.confidenceScore - a.confidenceScore)
      .slice(0, limit);
  }
}
