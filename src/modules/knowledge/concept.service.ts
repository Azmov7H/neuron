/**
 * Concept Service
 * CRUD + graph intelligence for the central Concept entity.
 */

import { Concept } from '@/database/models/knowledge/concept.model';
import { Relationship } from '@/database/models/knowledge/relationship.model';
import { AppError } from '@/types';
import {
  IConcept,
  IConceptTreeNode,
  ScientificDomain,
  Difficulty,
  LearningLevel,
  RelationshipType,
} from '@/types';
import { getVectorStore } from './vector-store';
import type { CreateConceptInput, UpdateConceptInput } from '@/validations/knowledge';

function denormalizeSearchText(c: Partial<IConcept>): string {
  return [
    c.title,
    c.summary,
    c.scientificDefinition,
    (c.applications ?? []).join(' '),
    (c.examples ?? []).map((e) => `${e.title} ${e.description}`).join(' '),
  ]
    .filter(Boolean)
    .join(' ');
}

export interface ConceptListFilter {
  domain?: ScientificDomain;
  difficulty?: Difficulty;
  learningLevel?: LearningLevel;
  isPublished?: boolean;
  prerequisiteOf?: string;
  relatedTo?: string;
  search?: string;
  sort?: 'importance' | 'views' | 'recent' | 'title';
  page?: number;
  pageSize?: number;
}

export class ConceptService {
  // ── CREATE ────────────────────────────
  static async create(input: CreateConceptInput): Promise<IConcept> {
    const existing = await Concept.findOne({ $or: [{ conceptId: input.conceptId }, { slug: input.slug }] });
    if (existing) {
      throw new AppError(409, 'Concept with this conceptId or slug already exists', 'CONCEPT_EXISTS');
    }

    const concept = await Concept.create({
      ...input,
      searchableText: denormalizeSearchText(input),
      version: { version: 1, editedAt: new Date() },
    });

    await this.syncDomainCount(input.field);
    return concept.toJSON() as IConcept;
  }

  // ── READ ──────────────────────────────
  static async getBySlug(slug: string): Promise<IConcept> {
    const concept = await Concept.findOne({ slug }).select('+embedding'); // embeddings excluded by default
    if (!concept) throw new AppError(404, 'Concept not found', 'CONCEPT_NOT_FOUND');
    return concept.toJSON() as IConcept;
  }

  static async getByConceptId(conceptId: string): Promise<IConcept> {
    const concept = await Concept.findOne({ conceptId });
    if (!concept) throw new AppError(404, 'Concept not found', 'CONCEPT_NOT_FOUND');
    return concept.toJSON() as IConcept;
  }

  static async getByIds(ids: string[]): Promise<IConcept[]> {
    const docs = await Concept.find({ conceptId: { $in: ids } });
    return docs.map((d) => d.toJSON() as IConcept);
  }

  // ── UPDATE ────────────────────────────
  static async update(conceptId: string, patch: UpdateConceptInput): Promise<IConcept> {
    const current = await Concept.findOne({ conceptId });
    if (!current) throw new AppError(404, 'Concept not found', 'CONCEPT_NOT_FOUND');

    const previousVersionId = current._id;
    const nextVersion = (current.version?.version ?? 1) + 1;

    const updated = await Concept.findOneAndUpdate(
      { conceptId },
      {
        $set: {
          ...patch,
          searchableText: denormalizeSearchText({ ...current.toJSON(), ...patch }),
          version: {
            version: nextVersion,
            previousVersionId,
            editedBy: patch.matrixNodeId, // not ideal; curators pass editedBy via route
            editedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updated) throw new AppError(404, 'Concept not found', 'CONCEPT_NOT_FOUND');

    if (patch.field && patch.field !== current.field) {
      await Promise.all([this.syncDomainCount(current.field), this.syncDomainCount(patch.field)]);
    }
    return updated.toJSON() as IConcept;
  }

  // ── DELETE ────────────────────────────
  static async remove(conceptId: string): Promise<void> {
    const concept = await Concept.findOne({ conceptId });
    if (!concept) throw new AppError(404, 'Concept not found', 'CONCEPT_NOT_FOUND');

    await Promise.all([
      Concept.deleteOne({ conceptId }),
      Relationship.deleteMany({ $or: [{ sourceId: conceptId }, { targetId: conceptId }] }),
    ]);

    await this.syncDomainCount(concept.field);
  }

  // ── PUBLISH / VIEWS / RATING ────────
  static async setPublished(conceptId: string, isPublished: boolean): Promise<IConcept> {
    const updated = await Concept.findOneAndUpdate(
      { conceptId },
      { $set: { isPublished } },
      { new: true }
    );
    if (!updated) throw new AppError(404, 'Concept not found', 'CONCEPT_NOT_FOUND');
    return updated.toJSON() as IConcept;
  }

  static async incrementViews(conceptId: string): Promise<void> {
    await Concept.updateOne({ conceptId }, { $inc: { views: 1 } });
  }

  static async rate(conceptId: string, value: number): Promise<IConcept> {
    if (value < 0 || value > 5) throw new AppError(400, 'Rating must be between 0 and 5', 'INVALID_RATING');
    const concept = await Concept.findOne({ conceptId });
    if (!concept) throw new AppError(404, 'Concept not found', 'CONCEPT_NOT_FOUND');

    const count = concept.ratingCount + 1;
    const avg = (concept.rating * concept.ratingCount + value) / count;
    const updated = await Concept.findOneAndUpdate(
      { conceptId },
      { $set: { rating: Math.round(avg * 100) / 100, ratingCount: count } },
      { new: true }
    );
    return updated!.toJSON() as IConcept;
  }

  // ── LIST / FILTER ─────────────────────
  static async list(filter: ConceptListFilter = {}) {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(filter.pageSize ?? 20, 100);

    const query: Record<string, unknown> = {};
    if (filter.domain) query.field = filter.domain;
    if (filter.difficulty) query.difficulty = filter.difficulty;
    if (filter.learningLevel) query.learningLevel = filter.learningLevel;
    if (typeof filter.isPublished === 'boolean') query.isPublished = filter.isPublished;
    if (filter.prerequisiteOf) query.prerequisites = filter.prerequisiteOf;
    if (filter.relatedTo) query.relatedConcepts = filter.relatedTo;
    if (filter.search) query.$text = { $search: filter.search };

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      importance: { importance: -1 },
      views: { views: -1 },
      recent: { createdAt: -1 },
      title: { title: 1 },
    };
    const sort = sortMap[filter.sort ?? 'importance'];

    const [items, total] = await Promise.all([
      Concept.find(query)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Concept.countDocuments(query),
    ]);

    return { items, total };
  }

  // ── RELATIONSHIP TRAVERSAL ────────────
  static async getRelated(conceptId: string, type?: RelationshipType): Promise<IConcept[]> {
    const relQuery: Record<string, unknown> = { sourceId: conceptId };
    if (type) relQuery.type = type;
    const rels = await Relationship.find(relQuery);
    const targets = rels.map((r) => r.targetId);
    if (targets.length === 0) return [];
    return this.getByIds(targets);
  }

  /**
   * BFS traversal over the relationship graph.
   * direction: 'out' follows source→target, 'in' follows target→source, 'both' both.
   */
  static async traverse(
    conceptId: string,
    direction: 'out' | 'in' | 'both' = 'out',
    maxDepth = 2
  ): Promise<Array<{ conceptId: string; depth: number; via: RelationshipType }>> {
    const visited = new Set<string>([conceptId]);
    const queue: Array<{ id: string; depth: number }> = [{ id: conceptId, depth: 0 }];
    const results: Array<{ conceptId: string; depth: number; via: RelationshipType }> = [];

    while (queue.length) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) continue;

      const or: Record<string, unknown>[] = [];
      if (direction === 'out' || direction === 'both') or.push({ sourceId: current.id });
      if (direction === 'in' || direction === 'both') or.push({ targetId: current.id });

      const rels = await Relationship.find(or.length ? { $or: or } : {});
      for (const rel of rels) {
        const nextId = rel.sourceId === current.id ? rel.targetId : rel.sourceId;
        if (visited.has(nextId)) continue;
        visited.add(nextId);
        results.push({ conceptId: nextId, depth: current.depth + 1, via: rel.type });
        queue.push({ id: nextId, depth: current.depth + 1 });
      }
    }
    return results;
  }

  // ── TAXONOMY TREE (concept-level) ─────
  static async buildConceptTree(rootConceptId: string): Promise<IConceptTreeNode> {
    const root = await this.getByConceptId(rootConceptId);

    const build = async (conceptId: string, depth = 0): Promise<IConceptTreeNode> => {
      const concept = depth === 0 ? root : await this.getByConceptId(conceptId);
      const children = await Promise.all(
        (concept.childConcepts ?? []).map((childId) => build(childId, depth + 1))
      );
      return {
        conceptId: concept.conceptId,
        title: concept.title,
        difficulty: concept.difficulty,
        children,
      };
    };

    return build(rootConceptId);
  }

  // ── VECTOR / EMBEDDING ────────────────
  static async setEmbedding(conceptId: string, embedding: number[], model: string): Promise<void> {
    const concept = await Concept.findOne({ conceptId });
    if (!concept) throw new AppError(404, 'Concept not found', 'CONCEPT_NOT_FOUND');
    concept.embedding = embedding;
    concept.embeddingModel = model;
    await concept.save();
    await getVectorStore().upsert([{ id: conceptId, values: embedding, metadata: { field: concept.field, difficulty: concept.difficulty } }]);
  }

  static async semanticSearch(vector: number[], topK = 10, domain?: ScientificDomain) {
    const store = getVectorStore();
    if (!store.isReady()) return [];
    return store.query(vector, topK, domain ? { field: domain } : undefined);
  }

  // ── DOMAIN COUNT SYNC ─────────────────
  static async syncDomainCount(domain: ScientificDomain): Promise<void> {
    const { DomainMeta } = await import('@/database/models/knowledge/domain.model');
    const count = await Concept.countDocuments({ field: domain, isPublished: true });
    await DomainMeta.updateOne({ slug: domain }, { $set: { conceptCount: count } }, { upsert: true });
  }
}
