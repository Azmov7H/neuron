/**
 * Spark Session Model
 * AI mentor conversation sessions with memory and insights
 */

import mongoose, { Schema, Document } from 'mongoose';
import { ISparkSession, SparkMessage } from '@/types';

const SparkMessageSchema = new Schema<SparkMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      minlength: [1, 'Message cannot be empty'],
      maxlength: [4000, 'Message too long'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      intent: String,
      entities: [String],
      concepts: [String],
    },
  },
  { _id: false }
);

const sparkSessionSchema = new Schema<ISparkSession & Document>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      index: true,
    },
    messages: {
      type: [SparkMessageSchema],
      default: [],
      validate: {
        validator: (v: SparkMessage[]) => v.length <= 100, // Limit history
        message: 'Message history limit exceeded',
      },
    },
    context: {
      currentPathId: Schema.Types.ObjectId,
      currentChapterId: String,
      userLevel: { type: Number, default: 0 },
      recentConcepts: [String],
    },
    insights: {
      misconceptions: [String],
      strengths: [String],
      recommendations: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: { expireAfterSeconds: 0 }, // TTL index for auto-deletion
    },
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1, domain: 1, createdAt: -1 },
      { expiresAt: 1 },
    ],
  }
);

// Method: add message to session
sparkSessionSchema.methods.addMessage = function (
  role: 'user' | 'assistant',
  content: string,
  metadata?: SparkMessage['metadata']
): void {
  if (this.messages.length >= 100) {
    // Keep only last 99 messages to make room for new one
    this.messages = this.messages.slice(1);
  }
  this.messages.push({
    role,
    content,
    timestamp: new Date(),
    metadata,
  });
  this.updatedAt = new Date();
};

export const SparkSession = mongoose.models.SparkSession as mongoose.Model<ISparkSession & Document> || mongoose.model<ISparkSession & Document>(
  'SparkSession',
  sparkSessionSchema
);
