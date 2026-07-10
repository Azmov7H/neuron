/**
 * Encyclopedia Article Model
 * Long-form, encyclopedic write-ups for scientific concepts.
 * Mirrors the conventions of concept.model.ts (singleton export
 * guard, sub-schemas with { _id: false }, enum spreads, timestamps).
 */

import mongoose, { Schema, Document } from 'mongoose';
import {
  IEncyclopediaArticle,
  SUPPORTED_DOMAINS,
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

const ArticleSectionSchema = new Schema(
  {
    heading: { type: String, required: true },
    content: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

// ── Encyclopedia article schema ─────────────

const EncyclopediaArticleSchema = new Schema<IEncyclopediaArticle & Document>(
  {
    articleId: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    conceptId: { type: String, index: true },

    domain: {
      type: String,
      enum: [...SUPPORTED_DOMAINS],
      required: true,
      index: true,
    },

    summary: { type: String },
    overview: { type: String },
    history: { type: String },

    sections: { type: [ArticleSectionSchema], default: [] },
    proofs: { type: [String], default: [] },

    equations: { type: [String], default: [] },
    research: { type: [String], default: [] },
    references: { type: [String], default: [] },
    citations: { type: [String], default: [] },
    relatedArticleIds: { type: [String], default: [] },

    animations: { type: [MediaReferenceSchema], default: [] },
    simulations: { type: [MediaReferenceSchema], default: [] },
    visualizations3D: { type: [MediaReferenceSchema], default: [] },

    realWorldApplications: { type: [String], default: [] },
    authors: { type: [String], default: [] },

    isFeatured: { type: Boolean, default: false, index: true },
    readingMinutes: { type: Number, default: 0 },
    views: { type: Number, default: 0, index: true },

    isPublished: { type: Boolean, default: false, index: true },

    version: { type: VersionInfoSchema, default: () => ({ version: 1, editedAt: new Date() }) },
  },
  {
    timestamps: true,
  }
);

EncyclopediaArticleSchema.index(
  { title: 'text', summary: 'text', overview: 'text', history: 'text' },
  { name: 'article_text', weights: { title: 10, summary: 5, overview: 3, history: 2 } }
);

export const EncyclopediaArticle = mongoose.models.EncyclopediaArticle as mongoose.Model<IEncyclopediaArticle & Document> ||
  mongoose.model<IEncyclopediaArticle & Document>('EncyclopediaArticle', EncyclopediaArticleSchema);
