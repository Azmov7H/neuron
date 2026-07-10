/**
 * Scientist Service
 * Biographies, timelines, discoveries, and influence networks.
 */

import { Scientist } from '@/database/models/knowledge/scientist.model';
import { SortOrder } from 'mongoose';
import { AppError } from '@/types';
import { IScientist } from '@/types';
import type { CreateScientistInput } from '@/validations/knowledge';

export interface ScientistFilter {
  field?: string;
  nationality?: string;
  isPublished?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export class ScientistService {
  static async create(input: CreateScientistInput): Promise<IScientist> {
    const existing = await Scientist.findOne({
      $or: [{ scientistId: input.scientistId }, { slug: input.slug }],
    });
    if (existing) throw new AppError(409, 'Scientist already exists', 'SCIENTIST_EXISTS');

    const doc = await Scientist.create(input);
    return doc.toJSON() as IScientist;
  }

  static async getBySlug(slug: string): Promise<IScientist> {
    const doc = await Scientist.findOne({ slug });
    if (!doc) throw new AppError(404, 'Scientist not found', 'SCIENTIST_NOT_FOUND');
    return doc.toJSON() as IScientist;
  }

  static async getByScientistId(scientistId: string): Promise<IScientist> {
    const doc = await Scientist.findOne({ scientistId });
    if (!doc) throw new AppError(404, 'Scientist not found', 'SCIENTIST_NOT_FOUND');
    return doc.toJSON() as IScientist;
  }

  static async update(scientistId: string, patch: Partial<CreateScientistInput>): Promise<IScientist> {
    if (patch.scientistId) throw new AppError(400, 'scientistId is immutable', 'IMMUTABLE_FIELD');
    const doc = await Scientist.findOneAndUpdate({ scientistId }, { $set: patch }, { new: true });
    if (!doc) throw new AppError(404, 'Scientist not found', 'SCIENTIST_NOT_FOUND');
    return doc.toJSON() as IScientist;
  }

  static async remove(scientistId: string): Promise<void> {
    const res = await Scientist.findOneAndDelete({ scientistId });
    if (!res) throw new AppError(404, 'Scientist not found', 'SCIENTIST_NOT_FOUND');
  }

  static async list(filter: ScientistFilter = {}) {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(filter.pageSize ?? 20, 100);

    const query: Record<string, unknown> = {};
    if (filter.field) query.fields = filter.field;
    if (filter.nationality) query.nationality = filter.nationality;
    if (typeof filter.isPublished === 'boolean') query.isPublished = filter.isPublished;
    if (filter.search) query.$text = { $search: filter.search };

    const sort: Record<string, unknown> = filter.search
      ? { score: { $meta: 'textScore' } }
      : { birthYear: 1 };

    const [items, total] = await Promise.all([
      Scientist.find(query)
        .sort(sort as unknown as Record<string, SortOrder>)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Scientist.countDocuments(query),
    ]);
    return { items, total };
  }
}
