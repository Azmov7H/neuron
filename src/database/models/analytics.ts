import mongoose, { Schema, Document, Types } from 'mongoose';
import { ILearningAnalytics } from '@/types/cognitive';

interface IDailyMetrics {
  date: Date;
  sessionDuration: number;
  conceptsDiscovered: number;
  xpEarned: number;
  activities: number;
}

interface IWeeklyMetrics {
  weekStart: Date;
  totalDuration: number;
  conceptsMastered: number;
  pathsCompleted: number;
  streak: number;
}

interface IMonthlyMetrics {
  month: Date;
  learningHours: number;
  conceptsAdded: number;
  masteryGained: number;
  growthRate: number;
}

interface IConceptMasteryMetrics {
  mastery: number;
  firstLearned: Date;
  lastPracticed: Date;
  practiceCount: number;
}

interface IDomainProgressMetrics {
  progress: number;
  conceptsCount: number;
  masteredCount: number;
  lastAccessed: Date;
}

const DailyMetricsSchema = new Schema<IDailyMetrics>(
  {
    date: { type: Date, required: true, index: true },
    sessionDuration: { type: Number, default: 0, min: 0 },
    conceptsDiscovered: { type: Number, default: 0, min: 0 },
    xpEarned: { type: Number, default: 0, min: 0 },
    activities: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const WeeklyMetricsSchema = new Schema<IWeeklyMetrics>(
  {
    weekStart: { type: Date, required: true, index: true },
    totalDuration: { type: Number, default: 0, min: 0 },
    conceptsMastered: { type: Number, default: 0, min: 0 },
    pathsCompleted: { type: Number, default: 0, min: 0 },
    streak: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const MonthlyMetricsSchema = new Schema<IMonthlyMetrics>(
  {
    month: { type: Date, required: true, index: true },
    learningHours: { type: Number, default: 0, min: 0 },
    conceptsAdded: { type: Number, default: 0, min: 0 },
    masteryGained: { type: Number, default: 0, min: 0 },
    growthRate: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const ConceptMasterySchema = new Schema<IConceptMasteryMetrics>(
  {
    mastery: { type: Number, min: 0, max: 100, default: 0 },
    firstLearned: { type: Date, default: Date.now },
    lastPracticed: { type: Date, default: Date.now },
    practiceCount: { type: Number, default: 1, min: 0 },
  },
  { _id: false }
);

const DomainProgressSchema = new Schema<IDomainProgressMetrics>(
  {
    progress: { type: Number, min: 0, max: 100, default: 0 },
    conceptsCount: { type: Number, default: 0, min: 0 },
    masteredCount: { type: Number, default: 0, min: 0 },
    lastAccessed: { type: Date, default: Date.now },
  },
  { _id: false }
);

const LearningAnalyticsSchema = new Schema<ILearningAnalytics & Document>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    daily: {
      type: Map,
      of: DailyMetricsSchema,
      default: {},
    },

    weekly: {
      type: Map,
      of: WeeklyMetricsSchema,
      default: {},
    },

    monthly: {
      type: Map,
      of: MonthlyMetricsSchema,
      default: {},
    },

    conceptMastery: {
      type: Map,
      of: ConceptMasterySchema,
      default: {},
    },

    domainProgress: {
      type: Map,
      of: DomainProgressSchema,
      default: {},
    },

    lastUpdated: { type: Date, default: Date.now, index: true },
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

LearningAnalyticsSchema.index({ userId: 1, lastUpdated: -1 });
LearningAnalyticsSchema.index({ 'daily.date': 1 });

export const LearningAnalytics = mongoose.models.LearningAnalytics as mongoose.Model<ILearningAnalytics & Document> || mongoose.model<ILearningAnalytics & Document>('LearningAnalytics', LearningAnalyticsSchema);