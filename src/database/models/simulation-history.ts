import mongoose, { Schema, Document, Types } from 'mongoose';
import { ISimulationHistory } from '@/types/cognitive';

const SimulationAttemptSchema = new Schema<{
  simulationId: string;
  attemptNumber: number;
  startedAt: Date;
  completedAt?: Date;
  duration: number;
  score: number;
  interactions: number;
  conceptsExplored: string[];
  mistakes: string[];
  insights: string[];
}>(
  {
    simulationId: { type: String, required: true, index: true },
    attemptNumber: { type: Number, required: true, min: 1 },
    startedAt: { type: Date, default: Date.now, index: true },
    completedAt: { type: Date, default: null },
    duration: { type: Number, default: 0, min: 0 },
    score: { type: Number, min: 0, max: 100, default: 0 },
    interactions: { type: Number, default: 0, min: 0 },
    conceptsExplored: { type: [String], default: [] },
    mistakes: { type: [String], default: [] },
    insights: { type: [String], default: [] },
  },
  { _id: false }
);

const SimulationHistorySchema = new Schema<ISimulationHistory & Document>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    simulations: {
      type: Map,
      of: {
        attempts: { type: [SimulationAttemptSchema], default: [] },
        bestScore: { type: Number, default: 0, min: 0 },
        averageScore: { type: Number, default: 0, min: 0 },
        totalTime: { type: Number, default: 0, min: 0 },
        conceptsMastered: { type: [String], default: [] },
      },
      default: {},
    },

    totalSimulations: { type: Number, default: 0, min: 0 },
    totalAttempts: { type: Number, default: 0, min: 0 },
    averageScore: { type: Number, default: 0, min: 0 },
    favoriteDomains: { type: [String], default: [] },

    lastUpdated: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

SimulationHistorySchema.index({ userId: 1, lastUpdated: -1 });
SimulationHistorySchema.index({ 'simulations.bestScore': -1 });

export const SimulationHistory = mongoose.models.SimulationHistory as mongoose.Model<ISimulationHistory & Document> || mongoose.model<ISimulationHistory & Document>('SimulationHistory', SimulationHistorySchema);