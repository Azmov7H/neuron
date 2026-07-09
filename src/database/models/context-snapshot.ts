import mongoose, { Schema, Document, Types } from 'mongoose';
import { IContextSnapshot } from '@/types/cognitive';

const ContextSnapshotSchema = new Schema<IContextSnapshot & Document>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    snapshotType: {
      type: String,
      enum: ['session-start', 'session-end', 'milestone', 'assessment'],
      required: true,
      index: true,
    },
    timestamp: { type: Date, default: Date.now, index: true },

    profile: { type: Schema.Types.Mixed, default: {} },
    memory: { type: Schema.Types.Mixed, default: {} },
    timeline: { type: Schema.Types.Mixed, default: {} },
    graph: { type: Schema.Types.Mixed, default: {} },
    analytics: { type: Schema.Types.Mixed, default: {} },

    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

ContextSnapshotSchema.index({ userId: 1, timestamp: -1 });
ContextSnapshotSchema.index({ snapshotType: 1, timestamp: -1 });
ContextSnapshotSchema.index({ createdAt: -1 });

export const ContextSnapshot = mongoose.models.ContextSnapshot as mongoose.Model<IContextSnapshot & Document> || mongoose.model<IContextSnapshot & Document>('ContextSnapshot', ContextSnapshotSchema);