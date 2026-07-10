/**
 * Experiment Service
 * Hands-on and historical experiments with procedures, variables,
 * expected outcomes, and interactive simulations.
 */

import { Experiment } from '@/database/models/knowledge/experiment.model';
import { SortOrder } from 'mongoose';
import { AppError } from '@/types';
import { IExperiment } from '@/types';
import type { CreateExperimentInput } from '@/validations/knowledge';

export interface ExperimentFilter {
  domain?: string;
  conceptId?: string;
  difficulty?: string;
  isPublished?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export class ExperimentService {
  static async create(input: CreateExperimentInput): Promise<IExperiment> {
    const existing = await Experiment.findOne({
      $or: [{ experimentId: input.experimentId }, { slug: input.slug }],
    });
    if (existing) throw new AppError(409, 'Experiment already exists', 'EXPERIMENT_EXISTS');

    const doc = await Experiment.create(input);
    return doc.toJSON() as IExperiment;
  }

  static async getBySlug(slug: string): Promise<IExperiment> {
    const doc = await Experiment.findOne({ slug });
    if (!doc) throw new AppError(404, 'Experiment not found', 'EXPERIMENT_NOT_FOUND');
    return doc.toJSON() as IExperiment;
  }

  static async getByExperimentId(experimentId: string): Promise<IExperiment> {
    const doc = await Experiment.findOne({ experimentId });
    if (!doc) throw new AppError(404, 'Experiment not found', 'EXPERIMENT_NOT_FOUND');
    return doc.toJSON() as IExperiment;
  }

  static async update(experimentId: string, patch: Partial<CreateExperimentInput>): Promise<IExperiment> {
    if (patch.experimentId) throw new AppError(400, 'experimentId is immutable', 'IMMUTABLE_FIELD');
    const doc = await Experiment.findOneAndUpdate({ experimentId }, { $set: patch }, { new: true });
    if (!doc) throw new AppError(404, 'Experiment not found', 'EXPERIMENT_NOT_FOUND');
    return doc.toJSON() as IExperiment;
  }

  static async remove(experimentId: string): Promise<void> {
    const res = await Experiment.findOneAndDelete({ experimentId });
    if (!res) throw new AppError(404, 'Experiment not found', 'EXPERIMENT_NOT_FOUND');
  }

  static async list(filter: ExperimentFilter = {}) {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(filter.pageSize ?? 20, 100);

    const query: Record<string, unknown> = {};
    if (filter.domain) query.domain = filter.domain;
    if (filter.conceptId) query.conceptIds = filter.conceptId;
    if (filter.difficulty) query.difficulty = filter.difficulty;
    if (typeof filter.isPublished === 'boolean') query.isPublished = filter.isPublished;
    if (filter.search) query.$text = { $search: filter.search };

    const sort: Record<string, unknown> = filter.search
      ? { score: { $meta: 'textScore' } }
      : { title: 1 };

    const [items, total] = await Promise.all([
      Experiment.find(query)
        .sort(sort as unknown as Record<string, SortOrder>)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Experiment.countDocuments(query),
    ]);
    return { items, total };
  }
}
