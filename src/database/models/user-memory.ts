import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUserMemory, IDiscoveryMemory, IInteractionMemory } from '@/types/cognitive';

interface IUserMemoryDocument extends IUserMemory, Document {
  conceptRelationships: mongoose.Types.Map<string[]>;
}

const DiscoveryMemorySchema = new Schema<IDiscoveryMemory>(
  {
    concept: { type: String, required: true, index: true },
    domain: { type: String, required: true, index: true },
    importance: { type: Number, min: 0, max: 100, default: 50 },
    firstDiscovered: { type: Date, default: Date.now, index: true },
    lastRevisited: { type: Date, default: Date.now, index: true },
    revisitCount: { type: Number, default: 1, min: 1 },
    relatedConcepts: { type: [String], default: [] },
  },
  { _id: false }
);

const InteractionMemorySchema = new Schema<IInteractionMemory>(
  {
    type: {
      type: String,
      enum: ['spark', 'simulation', 'matrix', 'quiz', 'path', 'research'],
      required: true,
    },
    targetId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    duration: { type: Number, default: 0, min: 0 },
    outcome: {
      type: String,
      enum: ['completed', 'skipped', 'failed', 'mastered'],
      default: 'completed',
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const UserMemorySchema = new Schema<IUserMemoryDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    recentConcepts: {
      type: [DiscoveryMemorySchema],
      default: [],
    },

    longTermInterests: {
      type: [String],
      default: [],
      index: true,
    },

    masteredConcepts: {
      type: [String],
      default: [],
      index: true,
    },

    conceptRelationships: {
      type: Schema.Types.Map,
      of: [String],
      default: {},
    },

    currentLearningGoal: { type: String, default: '' },

    currentPathId: {
      type: Schema.Types.ObjectId,
      ref: 'NeuralPath',
      default: null,
    },

    currentChapterId: { type: String, default: '' },

    activeSimulations: {
      type: [Schema.Types.ObjectId],
      ref: 'SimulationRun',
      default: [],
    },

    interactionHistory: {
      type: [InteractionMemorySchema],
      default: [],
    },

    commonMistakes: {
      type: [
        {
          concept: { type: String, required: true },
          mistake: { type: String, required: true },
          correctedAt: { type: Date, default: Date.now },
          frequency: { type: Number, default: 1, min: 1 },
        },
      ],
      default: [],
    },

    preferredExplanationStyle: {
      type: String,
      enum: ['visual', 'text', 'interactive', 'analogy'],
      default: 'text',
    },

    knowledgeGaps: {
      type: [String],
      default: [],
    },

    futureRecommendations: {
      type: [Schema.Types.ObjectId],
      ref: 'Recommendation',
      default: [],
    },

    lastUpdated: { type: Date, default: Date.now, index: true },
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

UserMemorySchema.index({ userId: 1, lastUpdated: -1 });
UserMemorySchema.index({ 'recentConcepts.concept': 1 });
UserMemorySchema.index({ 'recentConcepts.lastRevisited': -1 });

export const UserMemory = mongoose.models.UserMemory as mongoose.Model<IUserMemoryDocument> || mongoose.model<IUserMemoryDocument>('UserMemory', UserMemorySchema);