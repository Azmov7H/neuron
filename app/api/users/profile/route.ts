/**
 * GET /api/users/profile
 * Get current user profile (requires auth)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, getAuthContext, withErrorHandling } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { User } from '@/database/models/user';
import { SimulationRun } from '@/database/models/simulation-run';
import { SparkSession } from '@/database/models/spark-session';
import { UserProgress } from '@/database/models/user-progress';
import { NeuralPath } from '@/database/models/neural-path';
import { Recommendation } from '@/database/models/recommendation';
import { EvolutionLog } from '@/database/models/evolution-log';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);

  if (!auth) {
    return ApiResponseHandler.unauthorized();
  }

  await connectDB();

  const user = await User.findById(auth.userId);

  if (!user) {
    return ApiResponseHandler.notFound('User not found');
  }

  // Get simulation run count
  const totalSimulations = await SimulationRun.countDocuments({ userId: auth.userId });

  // Get spark session count
  const totalSparkSessions = await SparkSession.countDocuments({ userId: auth.userId });

  // Get recent activity (evolution logs)
  const recentActivity = await EvolutionLog.find({ userId: auth.userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Get user progress and associated neural paths to show actual progress
  const pathProgresses = await UserProgress.find({ userId: auth.userId }).lean();
  const pathIds = pathProgresses.map((p) => p.pathId);
  const paths = await NeuralPath.find({ _id: { $in: pathIds } } as any).lean();
  
  const neuralPathsProgress = pathProgresses.map((p) => {
    const path = paths.find((pathObj) => pathObj._id.toString() === p.pathId.toString());
    return {
      title: path?.title || 'Unknown Path',
      progress: p.overallCompletion || 0,
    };
  });

  // Get active recommendations
  let recommendations = await Recommendation.find({
    userId: auth.userId,
    expiresAt: { $gt: new Date() },
  })
    .sort({ relevanceScore: -1 })
    .limit(5)
    .lean();

  // If no recommendations exist, generate some
  if (recommendations.length === 0) {
    try {
      const { RecommendationsService } = await import('@/modules/recommendations/recommendations.service');
      await RecommendationsService.generateRecommendations(auth.userId, 5);
      recommendations = await Recommendation.find({
        userId: auth.userId,
        expiresAt: { $gt: new Date() },
      })
        .sort({ relevanceScore: -1 })
        .limit(5)
        .lean();
    } catch (e) {
      console.error('Failed to generate recommendations in profile:', e);
    }
  }

  const profileData = {
    user: user.toJSON(),
    totalSimulations,
    totalSparkSessions,
    recentActivity,
    neuralPathsProgress,
    recommendations,
  };

  return ApiResponseHandler.success(profileData, 'Profile retrieved');
}

export const GET = withErrorHandling(requireAuth(handler));
