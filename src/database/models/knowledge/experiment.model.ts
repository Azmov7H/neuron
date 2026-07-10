/**
 * Experiment Model
 * Hands-on experiments and historical procedures tied to
 * scientific concepts. Mirrors the conventions of
 * concept.model.ts (singleton export guard, sub-schemas with
 * { _id: false }, enum spreads, timestamps).
 */

import mongoose, { Schema, Document } from 'mongoose';
import {
  IExperiment,
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

const ExperimentVariableSchema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['independent', 'dependent', 'controlled'],
      required: true,
    },
    unit: { type: String },
    description: { type: String },
  },
  { _id: false }
);

// ── Experiment schema ──────────────────────

const ExperimentSchema = new Schema<IExperiment & Document>(
  {
    experimentId: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },

    domain: {
      type: String,
      enum: [...SUPPORTED_DOMAINS],
      required: true,
      index: true,
    },

    conceptIds: { type: [String], default: [], index: true },

    purpose: { type: String },
    equipment: { type: [String], default: [] },
    procedure: { type: [String], default: [] },

    variables: { type: [ExperimentVariableSchema], default: [] },

    theory: { type: String },
    expectedOutcome: { type: String },

    interactiveSimulation: { type: MediaReferenceSchema, required: false },

    historicalSignificance: { type: String },
    scientistIds: { type: [String], default: [] },
    citations: { type: [String], default: [] },

    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },

    estimatedMinutes: { type: Number, default: 0 },

    isPublished: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

ExperimentSchema.index(
  { title: 'text', purpose: 'text', theory: 'text', expectedOutcome: 'text' },
  { name: 'experiment_text', weights: { title: 10, purpose: 5, theory: 3, expectedOutcome: 2 } }
);

export const Experiment = mongoose.models.Experiment as mongoose.Model<IExperiment & Document> ||
  mongoose.model<IExperiment & Document>('Experiment', ExperimentSchema);
