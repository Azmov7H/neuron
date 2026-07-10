/**
 * Concept Model
 * The central scientific entity. Designed to scale to millions of
 * concepts: single-field indexes for filters, compound indexes for
 * common queries, a $text index for full-text search, and an
 * embedding array reserved for a future vector store.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  IConcept,
  SUPPORTED_DOMAINS,
  Difficulty,
  LearningLevel,
  SourceProvider,
} from '@/types';

// ── Sub-schemas ─────────────────────────────

const MediaReferenceSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ['image', 'video', 'threeDModel', 'simulation', 'quiz', 'interactive'],
      required: true,
    },
    url: { type: String, required: true },
    title: { type: String },
    provider: { type: String },
    thumbnail: { type: String },
    durationSeconds: { type: Number },
    license: { type: String },
    attribution: { type: String },
  },
  { _id: false }
);

const ScientificExampleSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    context: { type: String },
    solution: { type: String },
  },
  { _id: false }
);

const AnalogySchema = new Schema(
  {
    analogy: { type: String, required: true },
    explains: { type: String, required: true },
    targetAudience: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
    },
  },
  { _id: false }
);

const MisconceptionSchema = new Schema(
  {
    misconception: { type: String, required: true },
    clarification: { type: String, required: true },
    commonCause: { type: String },
  },
  { _id: false }
);

const ProvenanceSchema = new Schema(
  {
    provider: {
      type: String,
      enum: [...SUPPORTED_DOMAINS, ...(['wikipedia', 'wikidata', 'openalex', 'pubmed', 'nasa', 'esa', 'cern', 'nist', 'arxiv', 'crossref', 'doi', 'manual'] as SourceProvider[])],
      required: true,
    },
    externalId: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    importedAt: { type: Date, default: Date.now },
    lastSyncedAt: { type: Date },
    confidence: { type: Number, min: 0, max: 1, default: 1 },
    rawHash: { type: String },
  },
  { _id: false }
);

const VersionInfoSchema = new Schema(
  {
    version: { type: Number, default: 1 },
    previousVersionId: { type: Schema.Types.ObjectId },
    editedBy: { type: String },
    editedAt: { type: Date, default: Date.now },
    changeSummary: { type: String },
  },
  { _id: false }
);

// ── Concept schema ──────────────────────────

const ConceptSchema = new Schema<IConcept & Document>(
  {
    conceptId: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    summary: { type: String, required: true },
    scientificDefinition: { type: String, required: true },
    history: { type: String, default: '' },
    discoverer: { type: [String], default: [] },

    field: {
      type: String,
      enum: [...SUPPORTED_DOMAINS],
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    importance: { type: Number, min: 0, max: 100, default: 50, index: true },
    learningLevel: {
      type: String,
      enum: ['k12', 'undergraduate', 'graduate', 'research'],
      default: 'undergraduate',
      index: true,
    },

    applications: { type: [String], default: [] },
    examples: { type: [ScientificExampleSchema], default: [] },
    analogies: { type: [AnalogySchema], default: [] },

    equations: { type: [String], default: [] },
    constants: { type: [String], default: [] },
    units: { type: [String], default: [] },
    laws: { type: [String], default: [] },

    relatedConcepts: { type: [String], default: [], index: true },
    parentConcepts: { type: [String], default: [] },
    childConcepts: { type: [String], default: [] },
    prerequisites: { type: [String], default: [], index: true },

    misconceptions: { type: [MisconceptionSchema], default: [] },

    experiments: { type: [String], default: [] },
    scientists: { type: [String], default: [] },
    papers: { type: [String], default: [] },
    books: { type: [String], default: [] },
    citations: { type: [String], default: [] },

    media: { type: [MediaReferenceSchema], default: [] },
    matrixNodeId: { type: String },
    learningPaths: { type: [String], default: [] },

    estimatedLearningMinutes: { type: Number, min: 0, default: 30 },

    // Semantic search (vector-ready)
    embedding: { type: [Number], required: false, select: false },
    embeddingModel: { type: String },

    searchableText: { type: String, select: false },

    provenance: { type: ProvenanceSchema, required: false },
    version: { type: VersionInfoSchema, default: () => ({ version: 1, editedAt: new Date() }) },

    views: { type: Number, default: 0, index: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    ratingCount: { type: Number, default: 0 },

    isPublished: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

// ── Indexes (scaling to millions of concepts) ─

ConceptSchema.index({ field: 1, importance: -1 });
ConceptSchema.index({ field: 1, difficulty: 1 });
ConceptSchema.index({ field: 1, isPublished: 1 });
ConceptSchema.index({ learningLevel: 1, difficulty: 1 });
ConceptSchema.index({ prerequisites: 1 });
ConceptSchema.index({ relatedConcepts: 1 });
ConceptSchema.index({ isPublished: 1, views: -1 });
// Full-text search across primary text fields.
ConceptSchema.index(
  { title: 'text', summary: 'text', scientificDefinition: 'text', searchableText: 'text' },
  { name: 'concept_text', weights: { title: 10, summary: 5, scientificDefinition: 3, searchableText: 2 } }
);

export const Concept = mongoose.models.Concept as mongoose.Model<IConcept & Document> ||
  mongoose.model<IConcept & Document>('Concept', ConceptSchema);
