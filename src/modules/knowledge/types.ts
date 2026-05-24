/**
 * Semantic Knowledge Engine Types
 */

export type RelationType =
  | 'prerequisite'
  | 'similarity'
  | 'causality'
  | 'mathematical_dependency'
  | 'conceptual_overlap'
  | 'interdisciplinary';

export interface ConceptRelation {
  sourceId: string;
  targetId: string;
  type: RelationType;
  strength: number; // 0.0 to 1.0
  confidence: number; // 0.0 to 1.0
}

export interface ConceptNode {
  id: string;
  title: string;
  domain: string;
  layer: number;
  importance: number; // 1 (highest/core) to 3 (deepest)
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  parentId: string | null;
  activationFrequency: number;
  position?: [number, number, number]; // UI hints
}

export interface ScoredEdge {
  source: string;
  target: string;
  type: RelationType;
  strength: number;
  confidence: number;
  semanticDistance: number;
  traversalWeight: number;
}

export interface ConceptCluster {
  id: string;
  name: string;
  domain: string;
  conceptIds: string[];
  centralConceptId: string;
}

export interface LearningGap {
  conceptId: string;
  missingPrerequisiteIds: string[];
}

export interface UserCognitiveProfile {
  completedConcepts: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';
  strengths: string[];
  weaknesses: string[];
  focusAreas: string[];
}

export interface RecommendationPayload {
  type: 'concept' | 'path' | 'simulation';
  targetId: string;
  targetTitle: string;
  reason: string;
  relevanceScore: number;
  confidenceScore: number;
}
