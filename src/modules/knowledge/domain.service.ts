/**
 * Domain Service
 * Catalog of scientific domains and their aggregate metadata.
 */

import { DomainMeta } from '@/database/models/knowledge/domain.model';
import { AppError } from '@/types';
import { IDomainMeta, ScientificDomain } from '@/types';
import type { CreateDomainInput } from '@/validations/knowledge';

export class DomainService {
  static async create(input: CreateDomainInput): Promise<IDomainMeta> {
    if (input.parentDomain && input.parentDomain === input.slug) {
      throw new AppError(400, 'A domain cannot be its own parent', 'INVALID_DOMAIN');
    }
    const existing = await DomainMeta.findOne({ slug: input.slug });
    if (existing) throw new AppError(409, 'Domain already exists', 'DOMAIN_EXISTS');

    const doc = await DomainMeta.create(input);
    return doc.toJSON() as IDomainMeta;
  }

  static async list(activeOnly = true): Promise<IDomainMeta[]> {
    const query = activeOnly ? { isActive: true } : {};
    const docs = await DomainMeta.find(query).sort({ name: 1 }).lean();
    return docs.map((d) => d as IDomainMeta);
  }

  static async getBySlug(slug: ScientificDomain): Promise<IDomainMeta> {
    const doc = await DomainMeta.findOne({ slug });
    if (!doc) throw new AppError(404, 'Domain not found', 'DOMAIN_NOT_FOUND');
    return doc.toJSON() as IDomainMeta;
  }

  static async recountConcepts(slug: ScientificDomain): Promise<void> {
    const { Concept } = await import('@/database/models/knowledge/concept.model');
    const count = await Concept.countDocuments({ field: slug, isPublished: true });
    await DomainMeta.updateOne({ slug }, { $set: { conceptCount: count } });
  }

  static async setActive(slug: ScientificDomain, isActive: boolean): Promise<IDomainMeta> {
    const doc = await DomainMeta.findOneAndUpdate(
      { slug },
      { $set: { isActive } },
      { new: true }
    );
    if (!doc) throw new AppError(404, 'Domain not found', 'DOMAIN_NOT_FOUND');
    return doc.toJSON() as IDomainMeta;
  }
}
