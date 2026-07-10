/**
 * GlossaryTerm Model
 * A glossary entry defining a scientific term, with synonyms and
 * related concepts.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IGlossaryTerm, SUPPORTED_DOMAINS } from '@/types';

// ── GlossaryTerm schema ─────────────────────

const GlossaryTermSchema = new Schema<IGlossaryTerm & Document>(
  {
    termId: { type: String, required: true, unique: true, index: true },
    term: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    definition: { type: String, required: true },
    pronunciation: { type: String },
    synonyms: { type: [String], default: [] },
    relatedConceptIds: { type: [String], default: [], index: true },
    domain: {
      type: String,
      enum: [...SUPPORTED_DOMAINS],
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    examples: { type: [String], default: [] },
    isPublished: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

GlossaryTermSchema.index(
  { term: 'text', definition: 'text', synonyms: 'text' },
  { name: 'glossary_text', weights: { term: 10, definition: 3, synonyms: 2 } }
);

export const GlossaryTerm = mongoose.models.GlossaryTerm as mongoose.Model<IGlossaryTerm & Document> ||
  mongoose.model<IGlossaryTerm & Document>('GlossaryTerm', GlossaryTermSchema);
