/**
 * Cognitive Profile Model
 * Core user cognitive state and learning metrics
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  ICognitiveProfile,
  ILearningMetrics,
  IAttentionMetrics,
  IRetentionMetrics,
  ILearningStyleMetrics,
} from '@/types/cognitive';

interface ICognitiveProfileDocument extends Omit<ICognitiveProfile, 'conceptRelationships'>, Document {
  conceptRelationships: mongoose.Types.Map<string>;
}

const LearningMetricsSchema = new Schema<ILearningMetrics>(
  {
    visual: { type: Number, min: 0, max: 100, default: 50 },
    reading: { type: Number, min: 0, max: 100, default: 50 },
    simulation: { type: Number, min: 0, max: 100, default: 50 },
    practical: { type: Number, min: 0, max: 100, default: 50 },
    theory: { type: Number, min: 0, max: 100, default: 50 },
  },
  { _id: false }
);

const AttentionMetricsSchema = new Schema<IAttentionMetrics>(
  {
    focusDuration: { type: Number, default: 25 },
    attentionSpan: { type: Number, min: 0, max: 100, default: 50 },
    distractionFrequency: { type: Number, default: 2 },
    peakFocusHours: { type: [Number], default: [9, 14, 19] },
  },
  { _id: false }
);

const RetentionMetricsSchema = new Schema<IRetentionMetrics>(
  {
    shortTerm: { type: Number, min: 0, max: 100, default: 50 },
    mediumTerm: { type: Number, min: 0, max: 100, default: 50 },
    longTerm: { type: Number, min: 0, max: 100, default: 50 },
    recallStrength: { type: Number, min: 0, max: 100, default: 50 },
  },
  { _id: false }
);

const CognitiveProfileSchema = new Schema<ICognitiveProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    learningStyle: {
      type: LearningMetricsSchema,
      default: () => ({}),
    },

    attention: {
      type: AttentionMetricsSchema,
      default: () => ({}),
    },

    retention: {
      type: RetentionMetricsSchema,
      default: () => ({}),
    },

    curiosity: { type: Number, min: 0, max: 100, default: 50 },
    explorationRate: { type: Number, min: 0, max: 100, default: 50 },
    problemSolving: { type: Number, min: 0, max: 100, default: 50 },
    learningSpeed: { type: Number, min: 0, max: 100, default: 50 },

    strongDomains: { type: [String], default: [] },
    weakDomains: { type: [String], default: [] },
    masteredConcepts: { type: [String], default: [] },
    recentConcepts: { type: [String], default: [] },

    preferredDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'adaptive'],
      default: 'adaptive',
    },
    sessionOptimalDuration: { type: Number, default: 45 },
    breakFrequency: { type: Number, default: 2 },
    practiceFrequency: { type: Number, default: 4 },

    aiInteractionStyle: {
      type: String,
      enum: ['questioning', 'explaining', 'demonstrating', 'collaborative'],
      default: 'collaborative',
    },
    explanationPreference: {
      type: String,
      enum: ['detailed', 'concise', 'analogy', 'example'],
      default: 'detailed',
    },

    confidenceScore: { type: Number, min: 0, max: 100, default: 50 },
    masteryScore: { type: Number, min: 0, max: 100, default: 0 },

    lastUpdated: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

// Indexes
CognitiveProfileSchema.index({ userId: 1 });
CognitiveProfileSchema.index({ confidenceScore: -1 });
CognitiveProfileSchema.index({ masteryScore: -1 });
CognitiveProfileSchema.index({ lastUpdated: -1 });

// Virtual for concept relationships
CognitiveProfileSchema.virtual('conceptRelationshipsMap').get(function (this: ICognitiveProfileDocument) {
  return this.conceptRelationships as mongoose.Types.Map<string>;
});

export const CognitiveProfile = mongoose.models.CognitiveProfile as mongoose.Model<ICognitiveProfileDocument> || mongoose.model<ICognitiveProfileDocument>('CognitiveProfile', CognitiveProfileSchema);