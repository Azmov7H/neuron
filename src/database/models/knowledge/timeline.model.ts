/**
 * TimelineEvent Model
 * A historical event placed on the scientific timeline, linked to
 * concepts, scientists, experiments, and equations.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { ITimelineEvent, SUPPORTED_DOMAINS, TimelineEra } from '@/types';

// ── Local enum spread ───────────────────────

const TIMELINE_ERAS: readonly TimelineEra[] = [
  'ancient',
  'classical',
  'medieval',
  'renaissance',
  'scientific-revolution',
  'enlightenment',
  'industrial',
  'modern',
  'contemporary',
] as const;

// ── TimelineEvent schema ────────────────────

const TimelineEventSchema = new Schema<ITimelineEvent & Document>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    year: { type: Number, required: true, index: true },
    era: {
      type: String,
      enum: [...TIMELINE_ERAS],
      required: true,
    },
    domain: {
      type: String,
      enum: [...SUPPORTED_DOMAINS],
      index: true,
    },
    description: { type: String },
    conceptIds: { type: [String], default: [] },
    scientistIds: { type: [String], default: [] },
    experimentIds: { type: [String], default: [] },
    equationIds: { type: [String], default: [] },
    relatedEventIds: { type: [String], default: [] },
    significance: { type: Number, min: 0, max: 100, default: 50, index: true },
  },
  {
    timestamps: true,
  }
);

export const TimelineEvent = mongoose.models.TimelineEvent as mongoose.Model<ITimelineEvent & Document> ||
  mongoose.model<ITimelineEvent & Document>('TimelineEvent', TimelineEventSchema);
