/**
 * Recommendation Model
 * Personalized recommendations for paths, concepts, and domains
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IRecommendation, RecommendationProfile as RecommendationProfileType } from '@/types';

const RecommendationProfileSchema = new Schema<RecommendationProfileType>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    interests: [String],
    preferredLearningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'kinesthetic', 'reading-writing'],
      default: 'visual',
    },
    strongestDomains: [String],
    weakestDomains: [String],
    curiosityPatterns: {
      naturalProgression: { type: Boolean, default: true },
      experimentationTendency: { type: Number, min: 0, max: 100, default: 50 },
      depthVsBreadt: { type: Number, min: 0, max: 100, default: 50 },
    },
    engagementMetrics: {
      completionRate: { type: Number, default: 0, min: 0, max: 100 },
      averageSessionDuration: { type: Number, default: 0 },
      consistencyScore: { type: Number, default: 0, min: 0, max: 100 },
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const recommendationSchema = new Schema<IRecommendation & Document>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['path', 'concept', 'domain'],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    targetTitle: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    relevanceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      index: true,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    metadata: {
      basedOnBehavior: { type: Boolean, default: false },
      basedOnProgress: { type: Boolean, default: false },
      basedOnInterests: { type: Boolean, default: false },
      basedOnPeerData: { type: Boolean, default: false },
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      index: { expireAfterSeconds: 0 }, // TTL index
    },
    viewed: { type: Boolean, default: false },
    clicked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

recommendationSchema.index({ userId: 1, type: 1, createdAt: -1 });
recommendationSchema.index({ userId: 1, relevanceScore: -1 });
recommendationSchema.index({ expiresAt: 1 });

export const RecommendationProfile = mongoose.models.RecommendationProfile as mongoose.Model<RecommendationProfileType> || mongoose.model<RecommendationProfileType>(
  'RecommendationProfile',
  RecommendationProfileSchema
);

export const Recommendation = mongoose.models.Recommendation as mongoose.Model<IRecommendation & Document> || mongoose.model<IRecommendation & Document>(
  'Recommendation',
  recommendationSchema
);
