import mongoose, { Schema, Document } from 'mongoose';

export interface IExploreActivity extends Document {
  userId: mongoose.Types.ObjectId;
  action: 'view_domain' | 'view_concept' | 'view_recommendation';
  targetId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ExploreActivitySchema = new Schema<IExploreActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { 
      type: String, 
      enum: ['view_domain', 'view_concept', 'view_recommendation'], 
      required: true 
    },
    targetId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Index for querying recent activity per user quickly
ExploreActivitySchema.index({ userId: 1, createdAt: -1 });
// Index for trending concepts (targetId) over time
ExploreActivitySchema.index({ action: 1, createdAt: -1, targetId: 1 });

export const ExploreActivity =
  mongoose.models.ExploreActivity ||
  mongoose.model<IExploreActivity>('ExploreActivity', ExploreActivitySchema);
