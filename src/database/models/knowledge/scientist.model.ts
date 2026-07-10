/**
 * Scientist Model
 * Represents a historical or contemporary scientist and their
 * contributions to the knowledge base.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IScientist, SUPPORTED_DOMAINS } from '@/types';

// ── Sub-schemas ─────────────────────────────

const ScientistTimelineEventSchema = new Schema(
  {
    year: { type: Number, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

// ── Scientist schema ────────────────────────

const ScientistSchema = new Schema<IScientist & Document>(
  {
    scientistId: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    fullName: { type: String, required: true },
    birthYear: { type: Number },
    deathYear: { type: Number },
    nationality: { type: [String], default: [] },
    biography: { type: String },
    timeline: { type: [ScientistTimelineEventSchema], default: [] },

    fields: {
      type: [String],
      enum: [...SUPPORTED_DOMAINS],
      default: [],
      index: true,
    },

    majorDiscoveries: { type: [String], default: [] },
    awards: { type: [String], default: [] },
    relatedConceptIds: { type: [String], default: [] },
    relatedExperimentIds: { type: [String], default: [] },
    relatedEquationIds: { type: [String], default: [] },
    influencedBy: { type: [String], default: [] },
    influenced: { type: [String], default: [] },
    citations: { type: [String], default: [] },
    portraitUrl: { type: String },
    isPublished: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

ScientistSchema.index(
  { name: 'text', fullName: 'text', biography: 'text', majorDiscoveries: 'text' },
  { name: 'scientist_text', weights: { name: 10, fullName: 6, biography: 3, majorDiscoveries: 4 } }
);

export const Scientist = mongoose.models.Scientist as mongoose.Model<IScientist & Document> ||
  mongoose.model<IScientist & Document>('Scientist', ScientistSchema);
