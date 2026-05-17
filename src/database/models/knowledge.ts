/**
 * Knowledge Model
 * Curated knowledge base for educational content retrieval
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IKnowledge } from '@/types';

export interface IKnowledgeDocument extends Omit<IKnowledge, '_id'>, Document {}

const knowledgeSchema = new Schema<IKnowledgeDocument>(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      index: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    relatedConcepts: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    examples: {
      type: [String],
      default: [],
    },
    relatedSimulations: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// High-performance indices
knowledgeSchema.index({ domain: 1, tags: 1 });
knowledgeSchema.index({ title: 'text', explanation: 'text', tags: 'text' });

export const Knowledge = mongoose.models.Knowledge as mongoose.Model<IKnowledgeDocument> || mongoose.model<IKnowledgeDocument>(
  'Knowledge',
  knowledgeSchema
);
