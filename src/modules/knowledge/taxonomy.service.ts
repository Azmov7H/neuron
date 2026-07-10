/**
 * Taxonomy Service
 * Hierarchical science classification (Science → Physics → Mechanics → ...).
 */

import { TaxonomyNode } from '@/database/models/knowledge/taxonomy.model';
import { AppError } from '@/types';
import { ITaxonomyNode, ScientificDomain } from '@/types';
import type { CreateTaxonomyNodeInput } from '@/validations/knowledge';

export class TaxonomyService {
  static async create(input: CreateTaxonomyNodeInput): Promise<ITaxonomyNode> {
    const parent = input.parentId
      ? await TaxonomyNode.findOne({ nodeId: input.parentId })
      : null;
    if (input.parentId && !parent) {
      throw new AppError(404, 'Parent taxonomy node not found', 'TAXONOMY_NOT_FOUND');
    }

    const existing = await TaxonomyNode.findOne({ nodeId: input.nodeId });
    if (existing) throw new AppError(409, 'Taxonomy node already exists', 'TAXONOMY_EXISTS');

    const level = input.level ?? (parent ? (parent.level ?? 0) + 1 : 0);
    const path = input.path ?? (parent ? [...(parent.path ?? []), input.nodeId] : [input.nodeId]);

    const node = await TaxonomyNode.create({ ...input, level, path });
    if (parent) {
      await TaxonomyNode.updateOne({ nodeId: parent.nodeId }, { $inc: { childCount: 1 } });
    }
    return node.toJSON() as ITaxonomyNode;
  }

  static async getByNodeId(nodeId: string): Promise<ITaxonomyNode> {
    const node = await TaxonomyNode.findOne({ nodeId });
    if (!node) throw new AppError(404, 'Taxonomy node not found', 'TAXONOMY_NOT_FOUND');
    return node.toJSON() as ITaxonomyNode;
  }

  static async list(domain?: ScientificDomain): Promise<ITaxonomyNode[]> {
    const query = domain ? { domain } : {};
    const nodes = await TaxonomyNode.find(query).sort({ order: 1, label: 1 }).lean();
    return nodes.map((n) => n as ITaxonomyNode);
  }

  static async getChildren(nodeId: string): Promise<ITaxonomyNode[]> {
    const nodes = await TaxonomyNode.find({ parentId: nodeId }).sort({ order: 1 }).lean();
    return nodes.map((n) => n as ITaxonomyNode);
  }

  /** Build a nested tree rooted at a node (or all roots when nodeId omitted). */
  static async buildTree(nodeId?: string): Promise<ITaxonomyNode[]> {
    const roots = nodeId
      ? [await this.getByNodeId(nodeId)]
      : await TaxonomyNode.find({ parentId: null })
          .sort({ order: 1 })
          .lean();

    const build = async (node: ITaxonomyNode): Promise<ITaxonomyNode> => {
      const children = await TaxonomyNode.find({ parentId: node.nodeId })
        .sort({ order: 1 })
        .lean();
      const childNodes = children.map((c) => c as ITaxonomyNode);
      const built = await Promise.all(childNodes.map(build));
      return { ...node, children: built };
    };

    return Promise.all(roots.map((r) => build(r as ITaxonomyNode)));
  }

  static async remove(nodeId: string): Promise<void> {
    const node = await TaxonomyNode.findOne({ nodeId });
    if (!node) throw new AppError(404, 'Taxonomy node not found', 'TAXONOMY_NOT_FOUND');
    const children = await TaxonomyNode.find({ parentId: nodeId });
    if (children.length) {
      throw new AppError(409, 'Cannot delete a taxonomy node with children', 'TAXONOMY_HAS_CHILDREN');
    }
    await TaxonomyNode.deleteOne({ nodeId });
  }
}
