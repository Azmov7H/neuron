/**
 * Relationship Service
 * Manages typed edges between concepts (isPartOf, dependsOn, ...).
 */

import { Relationship } from '@/database/models/knowledge/relationship.model';
import { Concept } from '@/database/models/knowledge/concept.model';
import { AppError } from '@/types';
import { IRelationship, RelationshipType } from '@/types';
import type { CreateRelationshipInput } from '@/validations/knowledge';

export interface RelationshipFilter {
  sourceId?: string;
  targetId?: string;
  type?: RelationshipType;
  page?: number;
  pageSize?: number;
}

export class RelationshipService {
  static async create(input: CreateRelationshipInput): Promise<IRelationship> {
    if (input.sourceId === input.targetId) {
      throw new AppError(400, 'A concept cannot relate to itself', 'INVALID_RELATIONSHIP');
    }

    const [source, target] = await Promise.all([
      Concept.exists({ conceptId: input.sourceId }),
      Concept.exists({ conceptId: input.targetId }),
    ]);
    if (!source) throw new AppError(404, 'Source concept not found', 'CONCEPT_NOT_FOUND');
    if (!target) throw new AppError(404, 'Target concept not found', 'CONCEPT_NOT_FOUND');

    const existing = await Relationship.findOne({ sourceId: input.sourceId, targetId: input.targetId, type: input.type });
    if (existing) {
      throw new AppError(409, 'Relationship already exists', 'RELATIONSHIP_EXISTS');
    }

    const rel = await Relationship.create(input);
    return rel.toJSON() as IRelationship;
  }

  static async list(filter: RelationshipFilter = {}) {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(filter.pageSize ?? 50, 200);

    const query: Record<string, unknown> = {};
    if (filter.sourceId) query.sourceId = filter.sourceId;
    if (filter.targetId) query.targetId = filter.targetId;
    if (filter.type) query.type = filter.type;

    const [items, total] = await Promise.all([
      Relationship.find(query)
        .sort({ weight: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Relationship.countDocuments(query),
    ]);
    return { items, total };
  }

  static async remove(id: string): Promise<void> {
    const res = await Relationship.findByIdAndDelete(id);
    if (!res) throw new AppError(404, 'Relationship not found', 'RELATIONSHIP_NOT_FOUND');
  }
}
