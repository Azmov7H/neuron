/**
 * Relationship Model
 * Directed (optionally bidirectional) edges between concepts in the
 * knowledge graph. Lightweight and denormalized for fast graph traversal:
 * every field used to filter or rank edges is indexed.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { IRelationship, RELATIONSHIP_TYPES } from '@/types';

// ── Relationship schema ─────────────────────

const RelationshipSchema = new Schema<IRelationship & Document>(
  {
    sourceId: { type: String, required: true, index: true },
    targetId: { type: String, required: true, index: true },

    type: {
      type: String,
      enum: [...RELATIONSHIP_TYPES],
      required: true,
      index: true,
    },

    weight: { type: Number, min: 0, max: 1, default: 0.5 },

    description: { type: String },

    bidirectional: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────

RelationshipSchema.index({ sourceId: 1, type: 1 });
RelationshipSchema.index({ targetId: 1 });
RelationshipSchema.index({ type: 1 });

export const Relationship = mongoose.models.Relationship as mongoose.Model<IRelationship & Document> ||
  mongoose.model<IRelationship & Document>('Relationship', RelationshipSchema);
