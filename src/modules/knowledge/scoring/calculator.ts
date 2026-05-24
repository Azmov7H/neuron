/**
 * Relation Scorer & Calculator
 */

import { ConceptRelation, RelationType } from '../types';

export class RelationScorer {
  /**
   * Calculates the semantic distance between two concepts.
   * Higher strength & confidence yields lower semantic distance.
   */
  static calculateSemanticDistance(strength: number, confidence: number): number {
    const s = Math.min(Math.max(strength, 0.01), 1.0);
    const c = Math.min(Math.max(confidence, 0.01), 1.0);

    // Semantic Distance = (1 - strength * 0.8) * (2 - confidence)
    // Range will be roughly between 0.2 and 2.0
    return parseFloat(((1.0 - s * 0.8) * (2.0 - c)).toFixed(4));
  }

  /**
   * Calculates the traversal weight (cost) for path solvers (e.g. Dijkstra).
   * Directional relations like prerequisites have higher reverse costs.
   */
  static calculateTraversalWeight(
    relation: ConceptRelation,
    direction: 'forward' | 'backward' = 'forward'
  ): number {
    const distance = this.calculateSemanticDistance(relation.strength, relation.confidence);
    const typeMultiplier = this.getRelationTypeMultiplier(relation.type, direction);

    return parseFloat((distance * typeMultiplier).toFixed(4));
  }

  /**
   * Helper to retrieve relation cost multipliers
   */
  private static getRelationTypeMultiplier(
    type: RelationType,
    direction: 'forward' | 'backward'
  ): number {
    switch (type) {
      case 'prerequisite':
        return direction === 'forward' ? 1.0 : 8.0; // Extremely high cost to traverse backwards
      case 'mathematical_dependency':
        return direction === 'forward' ? 1.2 : 6.0;
      case 'causality':
        return direction === 'forward' ? 1.1 : 4.0;
      case 'conceptual_overlap':
        return 0.75; // Very easy to traverse overlapping concepts bidirectionally
      case 'similarity':
        return 0.85;
      case 'interdisciplinary':
        return 1.4; // Slightly harder to cross domains
      default:
        return 1.0;
    }
  }
}
