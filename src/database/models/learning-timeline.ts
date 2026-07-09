import mongoose, { Schema, Document, Types } from 'mongoose';
import { ILearningTimeline, ITimelineNode } from '@/types/cognitive';

const TimelineNodeSchema = new Schema<ITimelineNode>(
  {
    conceptId: { type: String, required: true, index: true },
    concept: { type: String, required: true, index: true },
    domain: { type: String, required: true, index: true },
    level: { type: Number, default: 1, min: 1 },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    discoveredAt: { type: Date, default: Date.now, index: true },
    masteredAt: { type: Date, default: null },
    dependencies: { type: [String], default: [] },
  },
  { _id: false }
);

const DomainTimelineSchema = new Schema<{
  conceptNodes: ITimelineNode[];
  progressionPath: string[];
  milestones: Array<{
    conceptId: string;
    achievedAt: Date;
    evidence: string[];
  }>;
}>(
  {
    conceptNodes: { type: [TimelineNodeSchema], default: [] },
    progressionPath: { type: [String], default: [] },
    milestones: {
      type: [
        {
          conceptId: { type: String, required: true },
          achievedAt: { type: Date, default: Date.now },
          evidence: { type: [String], default: [] },
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const LearningTimelineSchema = new Schema<ILearningTimeline & Document>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    domains: {
      type: Map,
      of: DomainTimelineSchema,
      default: {},
    },

    overallProgress: { type: Number, min: 0, max: 100, default: 0, index: true },
    totalConcepts: { type: Number, default: 0, min: 0 },
    masteredConcepts: { type: Number, default: 0, min: 0, index: true },
    currentFocus: { type: String, default: '' },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

LearningTimelineSchema.index({ userId: 1, overallProgress: -1 });
LearningTimelineSchema.index({ updatedAt: -1 });

export const LearningTimeline = mongoose.models.LearningTimeline as mongoose.Model<ILearningTimeline & Document> || mongoose.model<ILearningTimeline & Document>('LearningTimeline', LearningTimelineSchema);