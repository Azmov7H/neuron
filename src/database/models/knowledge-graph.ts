import mongoose, { Schema, Document, Types } from 'mongoose';
import { IKnowledgeGraph, IKnowledgeNode } from '@/types/cognitive';

const KnowledgeNodeSchema = new Schema<IKnowledgeNode>(
  {
    conceptId: { type: String, required: true, index: true },
    title: { type: String, required: true, index: true },
    domain: { type: String, required: true, index: true },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    importance: { type: Number, min: 0, max: 100, default: 50, index: true },

    prerequisites: { type: [String], default: [] },
    relatedConcepts: { type: [String], default: [] },
    applications: { type: [String], default: [] },
    historicalContext: { type: [String], default: [] },

    resources: {
      articles: { type: [String], default: [] },
      videos: { type: [String], default: [] },
      simulations: { type: [String], default: [] },
      papers: { type: [String], default: [] },
      equations: { type: [String], default: [] },
      visualizations: { type: [String], default: [] },
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
  },
  { _id: false }
);

const KnowledgeGraphSchema = new Schema<IKnowledgeGraph & Document>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    nodes: {
      type: Map,
      of: KnowledgeNodeSchema,
      default: {},
    },

    edges: {
      type: [
        {
          source: { type: String, required: true, index: true },
          target: { type: String, required: true, index: true },
          type: {
            type: String,
            enum: ['prerequisite', 'related', 'application', 'historical'],
            required: true,
          },
          weight: { type: Number, min: 0, max: 1, default: 0.5 },
        },
      ],
      default: [],
    },

    domains: {
      type: Map,
      of: {
        conceptIds: { type: [String], default: [] },
        centrality: { type: Number, min: 0, max: 100, default: 0 },
      },
      default: {},
    },

    lastUpdated: { type: Date, default: Date.now, index: true },
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

KnowledgeGraphSchema.index({ userId: 1, lastUpdated: -1 });
KnowledgeGraphSchema.index({ 'nodes.domain': 1 });
KnowledgeGraphSchema.index({ 'nodes.difficulty': 1 });

export const KnowledgeGraph = mongoose.models.KnowledgeGraph as mongoose.Model<IKnowledgeGraph & Document> || mongoose.model<IKnowledgeGraph & Document>('KnowledgeGraph', KnowledgeGraphSchema);