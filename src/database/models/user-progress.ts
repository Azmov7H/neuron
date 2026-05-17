/**
 * User Progress Model
 * Tracks user progression through neural paths
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IUserProgress } from '@/types';

const userProgressSchema = new Schema<IUserProgress & Document>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pathId: {
      type: Schema.Types.ObjectId,
      ref: 'NeuralPath',
      required: true,
      index: true,
    },
    currentChapterId: {
      type: String,
      required: true,
    },
    chapterProgress: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    overallCompletion: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      index: true,
    },
    xpEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    timeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedAt: Date,
    startedAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

userProgressSchema.index({ userId: 1, pathId: 1 }, { unique: true });
userProgressSchema.index({ userId: 1, lastAccessedAt: -1 });
userProgressSchema.index({ pathId: 1, overallCompletion: -1 });

// Update lastAccessedAt on save
userProgressSchema.pre<IUserProgress & Document>('save', async function () {
  this.lastAccessedAt = new Date();
});

// Virtual: completion percentage
userProgressSchema.virtual('completionPercentage').get(function () {
  return this.overallCompletion;
});

export const UserProgress = mongoose.models.UserProgress as mongoose.Model<IUserProgress & Document> || mongoose.model<IUserProgress & Document>(
  'UserProgress',
  userProgressSchema
);
