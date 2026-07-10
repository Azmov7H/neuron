/**
 * Citation Model
 * A bibliographic citation (article, book, journal, etc.) with
 * rendered citation styles and linked concepts.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { ICitation } from '@/types';

// ── Citation schema ─────────────────────────

const CitationSchema = new Schema<ICitation & Document>(
  {
    citationId: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ['article', 'book', 'journal', 'web', 'conference', 'thesis', 'patent', 'dataset'],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    authors: { type: [String], default: [] },
    year: { type: Number },
    publisher: { type: String },
    journal: { type: String },
    volume: { type: String },
    issue: { type: String },
    pages: { type: String },
    doi: { type: String },
    url: { type: String },
    accessedAt: { type: Date },
    bibtex: { type: String },
    apa: { type: String },
    mla: { type: String },
    chicago: { type: String },
    relatedConceptIds: { type: [String], default: [], index: true },
  },
  {
    timestamps: true,
  }
);

export const Citation = mongoose.models.Citation as mongoose.Model<ICitation & Document> ||
  mongoose.model<ICitation & Document>('Citation', CitationSchema);
