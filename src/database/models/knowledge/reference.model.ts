/**
 * Reference Model
 * A link to an external source (Wikipedia, OpenAlex, PubMed, etc.)
 * that supports one or more concepts.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IReference, SUPPORTED_DOMAINS, SourceProvider } from '@/types';

// ── Local enum spread ───────────────────────

const SOURCE_PROVIDERS: readonly SourceProvider[] = [
  'wikipedia',
  'wikidata',
  'openalex',
  'pubmed',
  'nasa',
  'esa',
  'cern',
  'nist',
  'arxiv',
  'crossref',
  'doi',
  'manual',
] as const;

// ── Reference schema ────────────────────────

const ReferenceSchema = new Schema<IReference & Document>(
  {
    referenceId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    provider: {
      type: String,
      enum: [...SOURCE_PROVIDERS],
      required: true,
    },
    domain: {
      type: String,
      enum: [...SUPPORTED_DOMAINS],
      index: true,
    },
    description: { type: String },
    authors: { type: [String], default: [] },
    publishedYear: { type: Number },
    doi: { type: String },
    pmid: { type: String },
    arxivId: { type: String },
    concepts: { type: [String], default: [], index: true },
    tags: { type: [String], default: [] },
    trustScore: { type: Number, min: 0, max: 1, default: 0.5 },
    isPeerReviewed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Reference = mongoose.models.Reference as mongoose.Model<IReference & Document> ||
  mongoose.model<IReference & Document>('Reference', ReferenceSchema);
