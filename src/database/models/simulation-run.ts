/**
 * Simulation Run Model
 * Stores history of deterministic scientific simulation parameters, states, and Spark AI telemetry analysis.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISimulationRun {
  simulationId: string;
  userId: mongoose.Types.ObjectId;
  domain: string;
  parameters: Record<string, any>;
  stateSnapshot: Record<string, any>;
  aiInterpretation: {
    explanation: string;
    keyInsights: string[];
    concepts: string[];
    recommendedActions: string[];
    metadata: {
      domain: string;
      simulationType: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      aiModel: string;
    };
  };
  timestamp: Date;
}

export interface ISimulationRunDocument extends Omit<ISimulationRun, 'userId'>, Document {
  userId: mongoose.Types.ObjectId;
}

const simulationRunSchema = new Schema<ISimulationRunDocument>(
  {
    simulationId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      index: true,
    },
    parameters: {
      type: Map,
      of: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    stateSnapshot: {
      type: Map,
      of: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    aiInterpretation: {
      explanation: {
        type: String,
        required: true,
      },
      keyInsights: {
        type: [String],
        default: [],
      },
      concepts: {
        type: [String],
        default: [],
      },
      recommendedActions: {
        type: [String],
        default: [],
      },
      metadata: {
        domain: { type: String, required: true },
        simulationType: { type: String, required: true },
        difficulty: { 
          type: String, 
          enum: ['beginner', 'intermediate', 'advanced'], 
          required: true,
          default: 'intermediate',
        },
        aiModel: { type: String, required: true, default: 'gemma-4-26b-a4b-it' },
      },
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

simulationRunSchema.index({ userId: 1, domain: 1, timestamp: -1 });

export const SimulationRun = mongoose.models.SimulationRun as mongoose.Model<ISimulationRunDocument> || mongoose.model<ISimulationRunDocument>(
  'SimulationRun',
  simulationRunSchema
);
