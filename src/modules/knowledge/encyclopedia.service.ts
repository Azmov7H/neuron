/**
 * Encyclopedia Service
 * Long-form, well-structured articles that explain a concept, a domain
 * topic, or a cross-cutting scientific theme in depth.
 */

import { EncyclopediaArticle } from '@/database/models/knowledge/encyclopedia.model';
import { AppError } from '@/types';
import { IEncyclopediaArticle } from '@/types';
import type { CreateArticleInput, UpdateArticleInput } from '@/validations/knowledge';

export interface ArticleFilter {
  domain?: string;
  conceptId?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export class EncyclopediaService {
  static async create(input: CreateArticleInput): Promise<IEncyclopediaArticle> {
    const existing = await EncyclopediaArticle.findOne({
      $or: [{ articleId: input.articleId }, { slug: input.slug }],
    });
    if (existing) throw new AppError(409, 'Encyclopedia article already exists', 'ARTICLE_EXISTS');

    const doc = await EncyclopediaArticle.create(input);
    return doc.toJSON() as IEncyclopediaArticle;
  }

  static async getBySlug(slug: string): Promise<IEncyclopediaArticle> {
    const doc = await EncyclopediaArticle.findOne({ slug });
    if (!doc) throw new AppError(404, 'Article not found', 'ARTICLE_NOT_FOUND');
    return doc.toJSON() as IEncyclopediaArticle;
  }

  static async getByArticleId(articleId: string): Promise<IEncyclopediaArticle> {
    const doc = await EncyclopediaArticle.findOne({ articleId });
    if (!doc) throw new AppError(404, 'Article not found', 'ARTICLE_NOT_FOUND');
    return doc.toJSON() as IEncyclopediaArticle;
  }

  static async update(articleId: string, patch: UpdateArticleInput): Promise<IEncyclopediaArticle> {
    const doc = await EncyclopediaArticle.findOneAndUpdate({ articleId }, { $set: patch }, { new: true });
    if (!doc) throw new AppError(404, 'Article not found', 'ARTICLE_NOT_FOUND');
    return doc.toJSON() as IEncyclopediaArticle;
  }

  static async remove(articleId: string): Promise<void> {
    const res = await EncyclopediaArticle.findOneAndDelete({ articleId });
    if (!res) throw new AppError(404, 'Article not found', 'ARTICLE_NOT_FOUND');
  }

  static async list(filter: ArticleFilter = {}) {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(filter.pageSize ?? 20, 100);

    const query: Record<string, unknown> = {};
    if (filter.domain) query.domain = filter.domain;
    if (filter.conceptId) query.conceptId = filter.conceptId;
    if (typeof filter.isFeatured === 'boolean') query.isFeatured = filter.isFeatured;
    if (typeof filter.isPublished === 'boolean') query.isPublished = filter.isPublished;
    if (filter.search) query.$text = { $search: filter.search };

    const [items, total] = await Promise.all([
      EncyclopediaArticle.find(query)
        .sort({ isFeatured: -1, readingMinutes: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      EncyclopediaArticle.countDocuments(query),
    ]);
    return { items, total };
  }

  static async listFeatured(domain?: string): Promise<IEncyclopediaArticle[]> {
    const query: Record<string, unknown> = { isFeatured: true, isPublished: true };
    if (domain) query.domain = domain;
    const docs = await EncyclopediaArticle.find(query).sort({ readingMinutes: -1 }).lean();
    return docs.map((d) => d as IEncyclopediaArticle);
  }
}
