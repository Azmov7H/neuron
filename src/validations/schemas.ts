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
