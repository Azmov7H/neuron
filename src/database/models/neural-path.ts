/**
 * Neural Path Model
 * Learning paths composed of chapters designed to teach specific domains
 */

import mongoose, { Schema, Document } from 'mongoose';
import { INeuralPath, Chapter } from '@/types';

const ChapterSchema = new Schema<Chapter>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    explanation: { type: String, required: true },
    objectives: [String],
    duration: { type: Number, required: true }, // minutes
    resources: [String],
    concepts: [String],
    examples: [String],
    quiz: { type: Schema.Types.Mixed },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const neuralPathSchema = new Schema<INeuralPath & Document>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'],
    },
    title: {
      type: String,
      required: [true, 'Path title is required'],
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title must not exceed 100 characters'],
    },
    description: {
      type: String,
      required: true,
      minlength: [20, 'Description must be at least 20 characters'],
    },
    domain: {
      type: String,
      required: true,
      enum: [
        'science',
        'technology',
        'mathematics',
        'philosophy',
        'history',
        'arts',
        'languages',
        'economics',
      ],
      index: true,
    },
    category: String,
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    estimatedTime: { type: Number, required: true }, // minutes
    chapters: {
      type: [ChapterSchema],
      required: true,
      validate: {
        validator: (v: Chapter[]) => v && v.length > 0,
        message: 'Path must have at least one chapter',
      },
    },
    prerequisites: [String],

    // Progression
    xpReward: { type: Number, required: true, min: 10, max: 1000 },
    difficulty_multiplier: { type: Number, default: 1, min: 0.5, max: 2 },

    // Engagement
    visitsCount: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0, min: 0, max: 100 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },

    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

neuralPathSchema.index({ domain: 1, isActive: 1 });
neuralPathSchema.index({ difficulty: 1, isActive: 1 });
neuralPathSchema.index({ completionRate: -1 });
neuralPathSchema.index({ createdAt: -1 });

// Virtual: total content time
neuralPathSchema.virtual('totalContentTime').get(function () {
  return this.chapters.reduce((sum, ch) => sum + ch.duration, 0);
});

export const NeuralPath = mongoose.models.NeuralPath as mongoose.Model<INeuralPath & Document> || mongoose.model<INeuralPath & Document>(
  'NeuralPath',
  neuralPathSchema
);
