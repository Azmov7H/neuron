import mongoose, { Schema, Document, Types } from 'mongoose';
import { IResearchBookmark } from '@/types/cognitive';

const ResearchBookmarkSchema = new Schema<IResearchBookmark & Document>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: { type: String, required: true },
    url: { type: String, required: true },
    domain: { type: String, required: true, index: true },
    concepts: { type: [String], default: [], index: true },
    importance: { type: Number, min: 0, max: 100, default: 50, index: true },
    savedAt: { type: Date, default: Date.now, index: true },
    tags: { type: [String], default: [] },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

ResearchBookmarkSchema.index({ userId: 1, savedAt: -1 });
ResearchBookmarkSchema.index({ domain: 1, importance: -1 });
ResearchBookmarkSchema.index({ 'concepts': 1 });

export const ResearchBookmark = mongoose.models.ResearchBookmark as mongoose.Model<IResearchBookmark & Document> || mongoose.model<IResearchBookmark & Document>('ResearchBookmark', ResearchBookmarkSchema);