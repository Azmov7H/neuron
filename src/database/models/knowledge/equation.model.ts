/**
 * Equation Model
 * Canonical mathematical equations with structured variables,
 * constants, derivations, and interactive solver metadata.
 * Mirrors the conventions of concept.model.ts (singleton export
 * guard, sub-schemas with { _id: false }, enum spreads, timestamps).
 */

import mongoose, { Schema, Document } from 'mongoose';
import {
  IEquation,
  SUPPORTED_DOMAINS,
} from '@/types';

// ── Sub-schemas ─────────────────────────────

const ScientificExampleSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    context: { type: String },
    solution: { type: String },
  },
  { _id: false }
);

const EquationVariableSchema = new Schema(
  {
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    unit: { type: String },
    description: { type: String },
    typicalRange: { type: String },
  },
  { _id: false }
);

const EquationConstantSchema = new Schema(
  {
    symbol: { type: String },
    value: { type: String },
    unit: { type: String },
  },
  { _id: false }
);

const InteractiveSolverSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    inputs: { type: [String], default: [] },
    outputSymbol: { type: String },
    formula: { type: String },
  },
  { _id: false }
);

// ── Equation schema ────────────────────────

const EquationSchema = new Schema<IEquation & Document>(
  {
    equationId: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true },
    latex: { type: String, required: true },
    mathml: { type: String },
    plainText: { type: String, required: true },

    domain: {
      type: String,
      enum: [...SUPPORTED_DOMAINS],
      required: true,
      index: true,
    },

    conceptIds: { type: [String], default: [], index: true },

    variables: { type: [EquationVariableSchema], default: [] },
    constants: { type: [EquationConstantSchema], default: [] },

    unitAnalysis: { type: String },
    derivation: { type: String },

    examples: { type: [ScientificExampleSchema], default: [] },

    interactiveSolver: { type: InteractiveSolverSchema, required: false },

    graphSupport: { type: Boolean, default: false },
    simulationLinks: { type: [String], default: [] },
    citations: { type: [String], default: [] },

    isPublished: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

EquationSchema.index(
  { label: 'text', plainText: 'text', latex: 'text', derivation: 'text' },
  { name: 'equation_text', weights: { label: 10, plainText: 5, latex: 3, derivation: 2 } }
);

export const Equation = mongoose.models.Equation as mongoose.Model<IEquation & Document> ||
  mongoose.model<IEquation & Document>('Equation', EquationSchema);
