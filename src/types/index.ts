import type { Types } from 'mongoose';

/**
 * Type Definitions
 * Centralized type system for the Neuron platform
 */

// ============================================
// USER TYPES
// ============================================

export interface CognitiveProfile {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';
  strengths: string[];
  weaknesses: string[];
  focusAreas: string[];
  adaptabilityScore: number; // 0-100
  consistencyScore: number; // 0-100
}

export interface UserDomainStatus {
  domain: string;
  xp: number;
  level: number;
  mastery: number; // 0-100
  lastAccessed: Date;
  pathsCompleted: number;
  conceptsDiscovered: number;
}

export interface IUser {
  _id: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;

  // Progression
  rank: string;
  totalXP: number;
  streak: number;
  lastActiveDate: Date;

  // Cognitive State
  cognitiveProfile: CognitiveProfile;
  domains: UserDomainStatus[];
  preferredDomains: string[];

  // Behavioral
  learningHistory: Array<Types.ObjectId | string>; // Path IDs
  discoveredConcepts: string[];
  savedResources: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// NEURAL PATH TYPES
// ============================================

export interface Chapter {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  duration: number; // minutes
  resources: string[];
  concepts: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  order: number;
}

export interface INeuralPath {
  _id: string;
  slug: string;
  title: string;
  description: string;
  domain: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  chapters: Chapter[];
  prerequisites: string[];

  // Progression
  xpReward: number;
  difficulty_multiplier: number;

  // Engagement
  visitsCount: number;
  completionRate: number;
  averageRating: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// ============================================
// USER PROGRESS TYPES
// ============================================

export interface IUserProgress {
  _id: string;
  userId: Types.ObjectId | string;
  pathId: Types.ObjectId | string;
  currentChapterId: string;
  chapterProgress: Map<string, number>; // chapterId -> completion %
  overallCompletion: number; // 0-100
  xpEarned: number;
  timeSpent: number; // seconds
  completedAt?: Date;
  startedAt: Date;
  lastAccessedAt: Date;
}

// ============================================
// SPARK AI SESSION TYPES
// ============================================

export interface SparkMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    entities?: string[];
    concepts?: string[];
  };
}

export interface ISparkSession {
  _id: string;
  userId: Types.ObjectId | string;
  domain: string;
  messages: SparkMessage[];
  context: {
    currentPathId?: Types.ObjectId | string;
    currentChapterId?: string;
    userLevel: number;
    recentConcepts: string[];
  };
  insights: {
    misconceptions: string[];
    strengths: string[];
    recommendations: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

// ============================================
// DISCOVERY TYPES
// ============================================

export interface IDiscovery {
  _id: string;
  userId: Types.ObjectId | string;
  conceptId: string;
  concept: string;
  domain: string;
  relatedConcepts: string[];
  importance: number; // 0-100
  context: {
    sourcePathId?: Types.ObjectId | string;
    sourceChapterId?: string;
    fromSparkSession?: Types.ObjectId | string;
  };
  userInterest: number; // 0-100 based on engagement
  discoveredAt: Date;
}

// ============================================
// RECOMMENDATIONS TYPES
// ============================================

export interface RecommendationProfile {
  userId: Types.ObjectId | string;
  interests: string[];
  preferredLearningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';
  strongestDomains: string[];
  weakestDomains: string[];
  curiosityPatterns: {
    naturalProgression: boolean; // sequential vs exploratory
    experimentationTendency: number; // 0-100
    depthVsBreadt: number; // 0 = depth, 100 = breadth
  };
  engagementMetrics: {
    completionRate: number;
    averageSessionDuration: number;
    consistencyScore: number;
  };
  lastUpdated: Date;
}

export interface IRecommendation {
  _id: string;
  userId: Types.ObjectId | string;
  type: 'path' | 'concept' | 'domain';
  targetId: string;
  targetTitle: string;
  reason: string;
  relevanceScore: number; // 0-1
  confidenceScore: number; // 0-1
  metadata: {
    basedOnBehavior: boolean;
    basedOnProgress: boolean;
    basedOnInterests: boolean;
    basedOnPeerData: boolean;
  };
  createdAt: Date;
  expiresAt: Date;
  viewed: boolean;
  clicked: boolean;
}

// ============================================
// AUTH TYPES
// ============================================

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse extends AuthTokens {
  user: Partial<IUser>;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================
// ERROR TYPES
// ============================================

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ============================================
// REQUEST CONTEXT
// ============================================

export interface RequestContext {
  userId: string;
  email: string;
  username: string;
  isAuthenticated: boolean;
}
