/**
 * Domain Meta Model
 * Catalog metadata for each scientific domain: display info, parent/child
 * domain relationships, UI accent color, and aggregate concept counts.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { IDomainMeta, SUPPORTED_DOMAINS } from '@/types';

// ── Domain schema ───────────────────────────

const DomainMetaSchema = new Schema<IDomainMeta & Document>(
  {
    slug: {
      type: String,
      enum: [...SUPPORTED_DOMAINS],
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    parentDomain: {
      type: String,
      enum: [...SUPPORTED_DOMAINS],
    },
    color: { type: String, required: true },
    icon: { type: String },
    conceptCount: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────

DomainMetaSchema.index({ isActive: 1 });
DomainMetaSchema.index({ parentDomain: 1 });

export const DomainMeta = mongoose.models.DomainMeta as mongoose.Model<IDomainMeta & Document> ||
  mongoose.model<IDomainMeta & Document>('DomainMeta', DomainMetaSchema);
