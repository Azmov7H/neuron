/**
 * Validation Schemas
 * Zod schemas for request validation
 */

import { z } from 'zod';

// ============================================
// AUTH SCHEMAS
// ============================================

export const RegisterSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must not exceed 20 characters')
      .regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, underscores, and hyphens')
      .toLowerCase(),
    email: z.string().trim().toLowerCase().email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and numbers'
      ),
    confirmPassword: z.string(),
    preferredDomain: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============================================
// USER SCHEMAS
// ============================================

export const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  avatar: z.string().url('Invalid URL').optional(),
  preferredDomains: z.array(z.string()).optional(),
});

// ============================================
// NEURAL PATH SCHEMAS
// ============================================

export const NeuralPathQuerySchema = z.object({
  domain: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  page: z
    .preprocess((value) => {
      if (typeof value === 'string') return Number(value);
      return value;
    }, z.number().int().positive().default(1)),
  limit: z
    .preprocess((value) => {
      if (typeof value === 'string') return Number(value);
      return value;
    }, z.number().int().positive().default(10)),
  sort: z.enum(['popular', 'newest', 'difficulty']).optional().default('popular'),
});

// ============================================
// PROGRESS SCHEMAS
// ============================================

export const UpdateProgressSchema = z.object({
  currentChapterId: z.string().min(1),
  chapterProgressMap: z.record(z.string(), z.number().min(0).max(100)).optional(),
  overallCompletion: z.number().min(0).max(100).optional(),
  xpEarned: z.number().min(0).optional(),
  timeSpent: z.number().min(0).optional(),
});

// ============================================
// SPARK SESSION SCHEMAS
// ============================================

export const CreateSparkSessionSchema = z.object({
  domain: z.string().min(1),
  currentPathId: z.string().optional(),
  currentChapterId: z.string().optional(),
});

export const SendSparkMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(4000, 'Message too long'),
  metadata: z
    .object({
      intent: z.string().optional(),
      entities: z.array(z.string()).optional(),
    })
    .optional(),
});

// ============================================
// DISCOVERY SCHEMAS
// ============================================

export const RecordDiscoverySchema = z.object({
  conceptId: z.string().min(1),
  concept: z.string().min(1),
  domain: z.string().min(1),
  relatedConcepts: z.array(z.string()).optional(),
  importance: z.number().min(0).max(100).optional(),
  sourcePathId: z.string().optional(),
  userInterest: z.number().min(0).max(100).optional(),
});

// ============================================
// RECOMMENDATION SCHEMAS
// ============================================

export const UpdateRecommendationProfileSchema = z.object({
  interests: z.array(z.string()).optional(),
  preferredLearningStyle: z
    .enum(['visual', 'auditory', 'kinesthetic', 'reading-writing'])
    .optional(),
  strongestDomains: z.array(z.string()).optional(),
  weakestDomains: z.array(z.string()).optional(),
});

// Type exports for use in API routes
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type SendSparkMessageInput = z.infer<typeof SendSparkMessageSchema>;
export type RecordDiscoveryInput = z.infer<typeof RecordDiscoverySchema>;

// ============================================
// COGNITIVE PROFILE SCHEMAS
// ============================================

export const UpdateCognitiveProfileSchema = z.object({
  learningStyle: z
    .object({
      visual: z.number().min(0).max(100).optional(),
      reading: z.number().min(0).max(100).optional(),
      simulation: z.number().min(0).max(100).optional(),
      practical: z.number().min(0).max(100).optional(),
      theory: z.number().min(0).max(100).optional(),
    })
    .optional(),
  attention: z
    .object({
      focusDuration: z.number().min(0).optional(),
      attentionSpan: z.number().min(0).max(100).optional(),
      distractionFrequency: z.number().min(0).optional(),
      peakFocusHours: z.array(z.number().min(0).max(23)).optional(),
    })
    .optional(),
  retention: z
    .object({
      shortTerm: z.number().min(0).max(100).optional(),
      mediumTerm: z.number().min(0).max(100).optional(),
      longTerm: z.number().min(0).max(100).optional(),
      recallStrength: z.number().min(0).max(100).optional(),
    })
    .optional(),
  curiosity: z.number().min(0).max(100).optional(),
  explorationRate: z.number().min(0).max(100).optional(),
  problemSolving: z.number().min(0).max(100).optional(),
  learningSpeed: z.number().min(0).max(100).optional(),
  strongDomains: z.array(z.string()).optional(),
  weakDomains: z.array(z.string()).optional(),
  masteredConcepts: z.array(z.string()).optional(),
  recentConcepts: z.array(z.string()).optional(),
  preferredDifficulty: z.enum(['easy', 'medium', 'hard', 'adaptive']).optional(),
  aiInteractionStyle: z.enum(['questioning', 'explaining', 'demonstrating', 'collaborative']).optional(),
  explanationPreference: z.enum(['detailed', 'concise', 'analogy', 'example']).optional(),
});

// ============================================
// USER MEMORY SCHEMAS
// ============================================

export const UpdateUserMemorySchema = z.object({
  currentLearningGoal: z.string().optional(),
  currentPathId: z.string().optional(),
  currentChapterId: z.string().optional(),
  preferredExplanationStyle: z.enum(['visual', 'text', 'interactive', 'analogy']).optional(),
  knowledgeGaps: z.array(z.string()).optional(),
});

export const RecordInteractionSchema = z.object({
  type: z.enum(['spark', 'simulation', 'matrix', 'quiz', 'path', 'research']),
  targetId: z.string().min(1),
  duration: z.number().min(0).optional(),
  outcome: z.enum(['completed', 'skipped', 'failed', 'mastered']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ============================================
// LEARNING TIMELINE SCHEMAS
// ============================================

export const AddTimelineNodeSchema = z.object({
  conceptId: z.string().min(1),
  concept: z.string().min(1),
  domain: z.string().min(1),
  level: z.number().min(1).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  dependencies: z.array(z.string()).optional(),
});

// ============================================
// KNOWLEDGE GRAPH SCHEMAS
// ============================================

export const AddKnowledgeNodeSchema = z.object({
  conceptId: z.string().min(1),
  title: z.string().min(1),
  domain: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  importance: z.number().min(0).max(100).optional(),
  prerequisites: z.array(z.string()).optional(),
  relatedConcepts: z.array(z.string()).optional(),
  applications: z.array(z.string()).optional(),
  historicalContext: z.array(z.string()).optional(),
});

export const AddEdgeSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  type: z.enum(['prerequisite', 'related', 'application', 'historical']),
  weight: z.number().min(0).max(1).optional(),
});

// ============================================
// ANALYTICS SCHEMAS
// ============================================

export const RecordDailyAnalyticsSchema = z.object({
  date: z.coerce.date().optional(),
  sessionDuration: z.number().min(0).optional(),
  conceptsDiscovered: z.number().min(0).optional(),
  xpEarned: z.number().min(0).optional(),
  activities: z.number().min(0).optional(),
});

export const RecordConceptMasterySchema = z.object({
  conceptId: z.string().min(1),
  mastery: z.number().min(0).max(100),
  practiceCount: z.number().min(1).optional(),
});

// ============================================
// RESEARCH BOOKMARK SCHEMAS
// ============================================

export const CreateResearchBookmarkSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  domain: z.string().min(1),
  concepts: z.array(z.string()).optional(),
  importance: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// ============================================
// CONTEXT SNAPSHOT SCHEMAS
// ============================================

export const CreateContextSnapshotSchema = z.object({
  snapshotType: z.enum(['session-start', 'session-end', 'milestone', 'assessment']),
});

// Type exports for use in API routes
export type UpdateCognitiveProfileInput = z.infer<typeof UpdateCognitiveProfileSchema>;
export type UpdateUserMemoryInput = z.infer<typeof UpdateUserMemorySchema>;
export type RecordInteractionInput = z.infer<typeof RecordInteractionSchema>;
export type AddTimelineNodeInput = z.infer<typeof AddTimelineNodeSchema>;
export type AddKnowledgeNodeInput = z.infer<typeof AddKnowledgeNodeSchema>;
export type AddEdgeInput = z.infer<typeof AddEdgeSchema>;
export type RecordDailyAnalyticsInput = z.infer<typeof RecordDailyAnalyticsSchema>;
export type RecordConceptMasteryInput = z.infer<typeof RecordConceptMasterySchema>;
export type CreateResearchBookmarkInput = z.infer<typeof CreateResearchBookmarkSchema>;
export type CreateContextSnapshotInput = z.infer<typeof CreateContextSnapshotSchema>;
