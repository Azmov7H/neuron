/**
 * Reference Service
 * External sources (Wikipedia, PubMed, NASA, arXiv, DOI, ...) that
 * back concepts and articles. Includes provenance, trust scoring,
 * and peer-review flags used by the import pipeline.
 */

import { Reference } from '@/database/models/knowledge/reference.model';
import { SortOrder } from 'mongoose';
import { AppError } from '@/types';
import { IReference, SourceProvider } from '@/types';
import type { CreateReferenceInput } from '@/validations/knowledge';

export interface ReferenceFilter {
  provider?: SourceProvider;
  domain?: string;
  isPeerReviewed?: boolean;
  minTrust?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export class ReferenceService {
  static async create(input: CreateReferenceInput): Promise<IReference> {
    const existing = await Reference.findOne({ referenceId: input.referenceId });
    if (existing) throw new AppError(409, 'Reference already exists', 'REFERENCE_EXISTS');

    const doc = await Reference.create(input);
    return doc.toJSON() as IReference;
  }

  static async getByReferenceId(referenceId: string): Promise<IReference> {
    const doc = await Reference.findOne({ referenceId });
    if (!doc) throw new AppError(404, 'Reference not found', 'REFERENCE_NOT_FOUND');
    return doc.toJSON() as IReference;
  }

  static async update(referenceId: string, patch: Partial<CreateReferenceInput>): Promise<IReference> {
    if (patch.referenceId) throw new AppError(400, 'referenceId is immutable', 'IMMUTABLE_FIELD');
    const doc = await Reference.findOneAndUpdate({ referenceId }, { $set: patch }, { new: true });
    if (!doc) throw new AppError(404, 'Reference not found', 'REFERENCE_NOT_FOUND');
    return doc.toJSON() as IReference;
  }

  static async remove(referenceId: string): Promise<void> {
    const res = await Reference.findOneAndDelete({ referenceId });
    if (!res) throw new AppError(404, 'Reference not found', 'REFERENCE_NOT_FOUND');
  }

  static async list(filter: ReferenceFilter = {}) {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(filter.pageSize ?? 20, 100);

    const query: Record<string, unknown> = {};
    if (filter.provider) query.provider = filter.provider;
    if (filter.domain) query.domain = filter.domain;
    if (typeof filter.isPeerReviewed === 'boolean') query.isPeerReviewed = filter.isPeerReviewed;
    if (typeof filter.minTrust === 'number') query.trustScore = { $gte: filter.minTrust };
    if (filter.search) query.$text = { $search: filter.search };

    const sort: Record<string, unknown> = filter.search
      ? { score: { $meta: 'textScore' } }
      : { trustScore: -1, publishedYear: -1 };

    const [items, total] = await Promise.all([
      Reference.find(query)
        .sort(sort as unknown as Record<string, SortOrder>)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Reference.countDocuments(query),
    ]);
    return { items, total };
  }

  static async byConcept(conceptId: string): Promise<IReference[]> {
    const docs = await Reference.find({ concepts: conceptId }).sort({ trustScore: -1 }).lean();
    return docs.map((d) => d as IReference);
  }
}
