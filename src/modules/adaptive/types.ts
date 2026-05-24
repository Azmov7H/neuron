/**
 * Adaptive Learning Engine Types
 */

export interface ConceptMastery {
  conceptId: string;
  familiarity: number; // 0.0 to 1.0
  masteryScore: number; // 0.0 to 1.0
  confusionProbability: number; // 0.0 to 1.0
  revisitPriority: number; // 0.0 to 1.0
  lastInteractionTimestamp: number;
}

export interface CognitiveProfile {
  userId: string;
  strengths: string[]; // List of domain names
  weaknesses: string[]; // List of domain names
  preferredDomains: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';
  totalXP: number;
  streak: number;
  lastUpdated: number;
}

export interface LearningAnalytics {
  momentum: number; // 0.0 to 1.0 (current study momentum)
  cognitiveVelocity: number; // XP earned per day (averaged)
  sessionFrequency: number; // study sessions per week
  consistency: number; // 0.0 to 1.0 (study rhythm consistency)
}

export interface SimulationActivity {
  simulationId: string;
  durationSeconds: number;
  actionsPerformed: number;
  successRate: number; // 0.0 to 1.0
  timestamp: number;
}

export interface SparkMessageLog {
  conceptId?: string;
  domain: string;
  userMessageLength: number;
  askedClarification: boolean;
  repliedClarification: boolean;
  timestamp: number;
}

export interface InteractionLog {
  type: 'concept_view' | 'simulation_run' | 'spark_chat' | 'path_milestone';
  conceptId: string;
  domain: string;
  xpEarned: number;
  timestamp: number;
  meta?: Record<string, any>;
}
