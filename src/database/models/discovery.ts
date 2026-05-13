/**
 * Discovery Model
 * Tracks user concept discoveries and learning serendipity
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IDiscovery } from '@/types';

const discoverySchema = new Schema<IDiscovery & Document>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conceptId: {
      type: String,
      required: true,
      index: true,
    },
    concept: {
      type: String,
      required: true,
      lowercase: true,
    },
    domain: {
      type: String,
      required: true,
      index: true,
    },
    relatedConcepts: [String],
    importance: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      index: true,
    },
    context: {
      sourcePathId: Schema.Types.ObjectId,
      sourceChapterId: String,
      fromSparkSession: Schema.Types.ObjectId,
    },
    userInterest: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      index: true,
    },
    discoveredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1, domain: 1 },
      { userId: 1, discoveredAt: -1 },
      { domain: 1, importance: -1 },
      { userId: 1, userInterest: -1 },
    ],
  }
);

export const Discovery = mongoose.models.Discovery as mongoose.Model<IDiscovery & Document> || mongoose.model<IDiscovery & Document>(
  'Discovery',
  discoverySchema
);
