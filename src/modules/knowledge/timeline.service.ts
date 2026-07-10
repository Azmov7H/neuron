/**
 * Timeline Service
 * Chronological scientific events across eras and domains.
 */

import { TimelineEvent } from '@/database/models/knowledge/timeline.model';
import { AppError } from '@/types';
import { ITimelineEvent, TimelineEra } from '@/types';
import type { CreateTimelineEventInput } from '@/validations/knowledge';

export interface TimelineFilter {
  era?: TimelineEra;
  domain?: string;
  minYear?: number;
  maxYear?: number;
  significanceMin?: number;
  page?: number;
  pageSize?: number;
}

export class TimelineService {
  static async create(input: CreateTimelineEventInput): Promise<ITimelineEvent> {
    const existing = await TimelineEvent.findOne({ eventId: input.eventId });
    if (existing) throw new AppError(409, 'Timeline event already exists', 'TIMELINE_EXISTS');

    const doc = await TimelineEvent.create(input);
    return doc.toJSON() as ITimelineEvent;
  }

  static async getByEventId(eventId: string): Promise<ITimelineEvent> {
    const doc = await TimelineEvent.findOne({ eventId });
    if (!doc) throw new AppError(404, 'Timeline event not found', 'TIMELINE_NOT_FOUND');
    return doc.toJSON() as ITimelineEvent;
  }

  static async update(eventId: string, patch: Partial<CreateTimelineEventInput>): Promise<ITimelineEvent> {
    if (patch.eventId) throw new AppError(400, 'eventId is immutable', 'IMMUTABLE_FIELD');
    const doc = await TimelineEvent.findOneAndUpdate({ eventId }, { $set: patch }, { new: true });
    if (!doc) throw new AppError(404, 'Timeline event not found', 'TIMELINE_NOT_FOUND');
    return doc.toJSON() as ITimelineEvent;
  }

  static async remove(eventId: string): Promise<void> {
    const res = await TimelineEvent.findOneAndDelete({ eventId });
    if (!res) throw new AppError(404, 'Timeline event not found', 'TIMELINE_NOT_FOUND');
  }

  static async list(filter: TimelineFilter = {}) {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(filter.pageSize ?? 50, 200);

    const query: Record<string, unknown> = {};
    if (filter.era) query.era = filter.era;
    if (filter.domain) query.domain = filter.domain;
    if (typeof filter.significanceMin === 'number') query.significance = { $gte: filter.significanceMin };

    if (filter.minYear !== undefined || filter.maxYear !== undefined) {
      const year: Record<string, number> = {};
      if (filter.minYear !== undefined) year.$gte = filter.minYear;
      if (filter.maxYear !== undefined) year.$lte = filter.maxYear;
      query.year = year;
    }

    const [items, total] = await Promise.all([
      TimelineEvent.find(query)
        .sort({ year: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      TimelineEvent.countDocuments(query),
    ]);
    return { items, total };
  }

  /** Full chronological spine (no pagination) for timeline visualizations. */
  static async getSpine(domain?: string): Promise<ITimelineEvent[]> {
    const query: Record<string, unknown> = domain ? { domain } : {};
    const docs = await TimelineEvent.find(query).sort({ year: 1, significance: -1 }).lean();
    return docs.map((d) => d as ITimelineEvent);
  }
}
