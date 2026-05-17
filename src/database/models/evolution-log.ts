import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEvolutionLog extends Document {
  userId: Types.ObjectId | string;
  type: 'XP_GAIN' | 'STREAK_UPDATE' | 'RANK_UP';
  xp: number;
  reason: string;
  metadata?: any;
  createdAt: Date;
}

const evolutionLogSchema = new Schema<IEvolutionLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['XP_GAIN', 'STREAK_UPDATE', 'RANK_UP'], required: true },
    xp: { type: Number, default: 0 },
    reason: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

evolutionLogSchema.index({ userId: 1, createdAt: -1 });

export const EvolutionLog =
  mongoose.models.EvolutionLog || mongoose.model<IEvolutionLog>('EvolutionLog', evolutionLogSchema);
