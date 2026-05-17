/**
 * Recommendations Service
 * Personalized recommendation engine with AI-aware persistence
 */

import { Recommendation, RecommendationProfile } from '@/database/models/recommendation';
import { User } from '@/database/models/user';
import { NeuralPath } from '@/database/models/neural-path';
import { Discovery } from '@/database/models/discovery';
import { AppError } from '@/types';

export class RecommendationsService {
  /**
   * Generate personalized recommendations
   */
  static async generateRecommendations(userId: string, limit = 5) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Get user's discoveries to understand interests
    const discoveries = await Discovery.find({ userId })
      .sort({ userInterest: -1, discoveredAt: -1 })
      .limit(10)
      .lean();

    // Get related paths based on discoveries
    const domainIds = discoveries.map((d) => d.domain);
    const query: any = {
      domain: { $in: domainIds },
      isActive: true,
      _id: { $nin: user.learningHistory },
    };

    const recommendedPaths = await NeuralPath.find(query)
      .sort({ completionRate: -1 })
      .limit(limit)
      .lean();

    // Create recommendation documents
    const recommendations = recommendedPaths.map((path, index) => ({
      userId,
      type: 'path' as const,
      targetId: path._id.toString(),
      targetTitle: path.title,
      reason: `Related to your interest in ${path.domain}`,
      relevanceScore: Math.max(0.5, 1 - index * 0.1),
      confidenceScore: 0.85,
      metadata: {
        basedOnBehavior: true,
        basedOnProgress: false,
        basedOnInterests: true,
        basedOnPeerData: false,
      },
    }));

    // Delete old recommendations and save new ones
    await Recommendation.deleteMany({
      userId,
      expiresAt: { $lt: new Date() },
    });

    if (recommendations.length > 0) {
      await Recommendation.insertMany(recommendations);
    }

    return recommendations;
  }

  /**
   * Get active recommendations for user
   */
  static async getRecommendations(userId: string) {
    const recommendations = await Recommendation.find({
      userId,
      expiresAt: { $gt: new Date() },
    })
      .sort({ relevanceScore: -1 })
      .lean();

    return recommendations;
  }

  /**
   * Track recommendation interaction
   */
  static async trackRecommendationClick(recommendationId: string) {
    await Recommendation.findByIdAndUpdate(recommendationId, {
      clicked: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Update user recommendation profile
   */
  static async updateRecommendationProfile(
    userId: string,
    updates: Partial<{
      interests: string[];
      strongestDomains: string[];
      weakestDomains: string[];
    }>
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    if (updates.interests) {
      user.cognitiveProfile.focusAreas = updates.interests;
    }

    if (updates.strongestDomains) {
      user.preferredDomains = updates.strongestDomains;
    }

    await user.save();
    return user;
  }
}
