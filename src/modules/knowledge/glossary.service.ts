/**
 * Glossary Service
 * Precise definitions of scientific terms with pronunciation,
 * synonyms, and related concepts.
 */

import { GlossaryTerm } from '@/database/models/knowledge/glossary.model';
import { SortOrder } from 'mongoose';
import { AppError } from '@/types';
import { IGlossaryTerm } from '@/types';
import type { CreateGlossaryTermInput } from '@/validations/knowledge';

export interface GlossaryFilter {
  domain?: string;
  difficulty?: string;
  isPublished?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export class GlossaryService {
  static async create(input: CreateGlossaryTermInput): Promise<IGlossaryTerm> {
    const existing = await GlossaryTerm.findOne({
      $or: [{ termId: input.termId }, { slug: input.slug }],
    });
    if (existing) throw new AppError(409, 'Glossary term already exists', 'GLOSSARY_EXISTS');

    const doc = await GlossaryTerm.create(input);
    return doc.toJSON() as IGlossaryTerm;
  }

  static async getBySlug(slug: string): Promise<IGlossaryTerm> {
    const doc = await GlossaryTerm.findOne({ slug });
    if (!doc) throw new AppError(404, 'Glossary term not found', 'GLOSSARY_NOT_FOUND');
    return doc.toJSON() as IGlossaryTerm;
  }

  static async getByTermId(termId: string): Promise<IGlossaryTerm> {
    const doc = await GlossaryTerm.findOne({ termId });
    if (!doc) throw new AppError(404, 'Glossary term not found', 'GLOSSARY_NOT_FOUND');
    return doc.toJSON() as IGlossaryTerm;
  }

  static async update(termId: string, patch: Partial<CreateGlossaryTermInput>): Promise<IGlossaryTerm> {
    if (patch.termId) throw new AppError(400, 'termId is immutable', 'IMMUTABLE_FIELD');
    const doc = await GlossaryTerm.findOneAndUpdate({ termId }, { $set: patch }, { new: true });
    if (!doc) throw new AppError(404, 'Glossary term not found', 'GLOSSARY_NOT_FOUND');
    return doc.toJSON() as IGlossaryTerm;
  }

  static async remove(termId: string): Promise<void> {
    const res = await GlossaryTerm.findOneAndDelete({ termId });
    if (!res) throw new AppError(404, 'Glossary term not found', 'GLOSSARY_NOT_FOUND');
  }

  static async list(filter: GlossaryFilter = {}) {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(filter.pageSize ?? 50, 200);

    const query: Record<string, unknown> = {};
    if (filter.domain) query.domain = filter.domain;
    if (filter.difficulty) query.difficulty = filter.difficulty;
    if (typeof filter.isPublished === 'boolean') query.isPublished = filter.isPublished;
    if (filter.search) query.$text = { $search: filter.search };

    const sort: Record<string, unknown> = filter.search
      ? { score: { $meta: 'textScore' } }
      : { term: 1 };

    const [items, total] = await Promise.all([
      GlossaryTerm.find(query)
        .sort(sort as unknown as Record<string, SortOrder>)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      GlossaryTerm.countDocuments(query),
    ]);
    return { items, total };
  }

  static async random(domain?: string, count = 1): Promise<IGlossaryTerm[]> {
    const match: Record<string, unknown> = { isPublished: true };
    if (domain) match.domain = domain;
    const docs = await GlossaryTerm.aggregate([
      { $match: match },
      { $sample: { size: count } },
    ]);
    return docs as IGlossaryTerm[];
  }
}
