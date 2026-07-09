import type { Types } from 'mongoose';

// ============================================
// COGNITIVE PROFILE TYPES
// ============================================

export interface ILearningMetrics {
  visual: number; // 0-100
  reading: number; // 0-100
  simulation: number; // 0-100
  practical: number; // 0-100
  theory: number; // 0-100
}

export interface IAttentionMetrics {
  focusDuration: number; // average focus time in minutes
  attentionSpan: number; // 0-100
  distractionFrequency: number; // events per session
  peakFocusHours: number[]; // 0-23
}

export interface IRetentionMetrics {
  shortTerm: number; // 0-100 (1 day)
  mediumTerm: number; // 0-100 (1 week)
  longTerm: number; // 0-100 (1 month)
  recallStrength: number; // 0-100
}

export interface ILearningStyleMetrics {
  preferredStyle: 'visual' | 'reading-write' | 'kinesthetic' | 'auditory';
  styleConfidence: number; // 0-100
  adaptationRate: number; // 0-100
}

export interface ICognitiveProfile {
  userId: Types.ObjectId | string;

  // Learning Style
  learningStyle: ILearningMetrics;

  // Attention & Retention
  attention: IAttentionMetrics;
  retention: IRetentionMetrics;

  // Behavioral Metrics
  curiosity: number; // 0-100
  explorationRate: number; // 0-100
  problemSolving: number; // 0-100
  learningSpeed: number; // 0-100

  // Domain-specific metrics
  strongDomains: string[];
  weakDomains: string[];
  masteredConcepts: string[];
  recentConcepts: string[];

  // Learning Patterns
  preferredDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  sessionOptimalDuration: number; // minutes
  breakFrequency: number; // breaks per hour
  practiceFrequency: number; // sessions per week

  // AI Interaction
  aiInteractionStyle: 'questioning' | 'explaining' | 'demonstrating' | 'collaborative';
  explanationPreference: 'detailed' | 'concise' | 'analogy' | 'example';

  // Scores
  confidenceScore: number; // 0-100
  masteryScore: number; // 0-100

  // Metadata
  lastUpdated: Date;
  version: number;
}

// ============================================
// USER MEMORY TYPES
// ============================================

export interface IDiscoveryMemory {
  concept: string;
  domain: string;
  importance: number; // 0-100
  firstDiscovered: Date;
  lastRevisited: Date;
  revisitCount: number;
  relatedConcepts: string[];
}

export interface IInteractionMemory {
  type: 'spark' | 'simulation' | 'matrix' | 'quiz' | 'path' | 'research';
  targetId: string;
  timestamp: Date;
  duration: number; // seconds
  outcome: 'completed' | 'skipped' | 'failed' | 'mastered';
  metadata: Record<string, unknown>;
}

export interface IUserMemory {
  userId: Types.ObjectId | string;

  // Concept Memory
  recentConcepts: IDiscoveryMemory[];
  longTermInterests: string[];
  masteredConcepts: string[];
  conceptRelationships: Types.Map<string[]>;

  // Current State
  currentLearningGoal: string;
  currentPathId: Types.ObjectId | string;
  currentChapterId: string;
  activeSimulations: Types.ObjectId[];

  // Interaction History
  interactionHistory: IInteractionMemory[];

  // Mistakes & Misconceptions
  commonMistakes: Array<{
    concept: string;
    mistake: string;
    correctedAt: Date;
    frequency: number;
  }>;

  // Preferences
  preferredExplanationStyle: 'visual' | 'text' | 'interactive' | 'analogy';
  knowledgeGaps: string[];

  // Future Recommendations
  futureRecommendations: Types.ObjectId[];

  // Metadata
  lastUpdated: Date;
  version: number;
}

// ============================================
// LEARNING TIMELINE TYPES
// ============================================

export interface ITimelineNode {
  conceptId: string;
  concept: string;
  domain: string;
  level: number;
  position: { x: number; y: number };
  discoveredAt: Date;
  masteredAt?: Date;
  dependencies: string[];
}

export interface ILearningTimeline {
  userId: Types.ObjectId | string;

  // Domain timelines
  domains: Types.Map<{
    conceptNodes: ITimelineNode[];
    progressionPath: string[];
    milestones: Array<{
      conceptId: string;
      achievedAt: Date;
      evidence: string[];
    }>;
  }>;

  // Overall progression
  overallProgress: number; // 0-100
  totalConcepts: number;
  masteredConcepts: number;
  currentFocus: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

// ============================================
// KNOWLEDGE GRAPH TYPES
// ============================================

export interface IKnowledgeNode {
  conceptId: string;
  title: string;
  domain: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  importance: number; // 0-100

  // Relationships
  prerequisites: string[]; // conceptIds
  relatedConcepts: string[]; // conceptIds
  applications: string[];
  historicalContext: string[];

  // Learning Resources
  resources: {
    articles: string[];
    videos: string[];
    simulations: string[];
    papers: string[];
    equations: string[];
    visualizations: string[];
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface IKnowledgeGraph {
  userId: Types.ObjectId | string;

  // Nodes
  nodes: Types.Map<IKnowledgeNode>;

  // Edges
  edges: Array<{
    source: string;
    target: string;
    type: 'prerequisite' | 'related' | 'application' | 'historical';
    weight: number;
  }>;

  // Domain clusters
  domains: Types.Map<{
    conceptIds: string[];
    centrality: number;
  }>;

  // Metadata
  lastUpdated: Date;
  version: number;
}

// ============================================
// SIMULATION HISTORY TYPES
// ============================================

export interface ISimulationAttempt {
  simulationId: string;
  attemptNumber: number;
  startedAt: Date;
  completedAt?: Date;
  duration: number; // seconds
  score: number; // 0-100
  interactions: number;
  conceptsExplored: string[];
  mistakes: string[];
  insights: string[];
}

export interface ISimulationHistory {
  userId: Types.ObjectId | string;

  // Per-simulation history
  simulations: Types.Map<{
    attempts: ISimulationAttempt[];
    bestScore: number;
    averageScore: number;
    totalTime: number;
    conceptsMastered: string[];
  }>;

  // Aggregate metrics
  totalSimulations: number;
  totalAttempts: number;
  averageScore: number;
  favoriteDomains: string[];

  // Metadata
  lastUpdated: Date;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface ILearningAnalytics {
  userId: Types.ObjectId | string;

  // Time-based metrics
  daily: Types.Map<{
    date: Date;
    sessionDuration: number;
    conceptsDiscovered: number;
    xpEarned: number;
    activities: number;
  }>;
  weekly: Types.Map<{
    weekStart: Date;
    totalDuration: number;
    conceptsMastered: number;
    pathsCompleted: number;
    streak: number;
  }>;
  monthly: Types.Map<{
    month: Date;
    learningHours: number;
    conceptsAdded: number;
    masteryGained: number;
    growthRate: number;
  }>;

  // Concept metrics
  conceptMastery: Types.Map<{
    mastery: number; // 0-100
    firstLearned: Date;
    lastPracticed: Date;
    practiceCount: number;
  }>;

  // Domain metrics
  domainProgress: Types.Map<{
    progress: number; // 0-100
    conceptsCount: number;
    masteredCount: number;
    lastAccessed: Date;
  }>;

  // Metadata
  lastUpdated: Date;
  version: number;
}

// ============================================
// RESEARCH BOOKMARK TYPES
// ============================================

export interface IResearchBookmark {
  userId: Types.ObjectId | string;
  title: string;
  url: string;
  domain: string;
  concepts: string[];
  importance: number; // 0-100
  savedAt: Date;
  tags: string[];
  notes?: string;
}

// ============================================
// CONTEXT SNAPSHOT TYPES
// ============================================

export interface IContextSnapshot {
  userId: Types.ObjectId | string;
  snapshotType: 'session-start' | 'session-end' | 'milestone' | 'assessment';
  timestamp: Date;

  // Context data
  profile: Partial<ICognitiveProfile>;
  memory: Partial<IUserMemory>;
  timeline: Partial<ILearningTimeline>;
  graph: Partial<IKnowledgeGraph>;
  analytics: Partial<ILearningAnalytics>;

  // Metadata
  version: number;
}