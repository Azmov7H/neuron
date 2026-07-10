/**
 * Taxonomy Node Model
 * A node in a domain's hierarchical taxonomy tree. Each node carries its
 * ancestor path and sibling order for efficient subtree and breadcrumb
 * queries. Leaf nodes optionally map to a Concept.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { ITaxonomyNode, SUPPORTED_DOMAINS } from '@/types';

// ── Taxonomy schema ─────────────────────────

const TaxonomyNodeSchema = new Schema<ITaxonomyNode & Document>(
  {
    nodeId: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true },

    domain: {
      type: String,
      enum: [...SUPPORTED_DOMAINS],
      required: true,
      index: true,
    },

    parentId: { type: String, default: null, index: true },
    conceptId: { type: String, index: true },
    level: { type: Number, required: true, index: true },
    path: { type: [String], index: true },
    order: { type: Number, default: 0 },
    description: { type: String },
    isLeaf: { type: Boolean, default: false, index: true },
    childCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────

TaxonomyNodeSchema.index({ domain: 1, level: 1 });
TaxonomyNodeSchema.index({ parentId: 1 });
TaxonomyNodeSchema.index({ isLeaf: 1 });

export const TaxonomyNode = mongoose.models.TaxonomyNode as mongoose.Model<ITaxonomyNode & Document> ||
  mongoose.model<ITaxonomyNode & Document>('TaxonomyNode', TaxonomyNodeSchema);
