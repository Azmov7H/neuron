/**
 * Equation Service
 * Structured math: LaTeX, variables, constants, unit analysis, derivations,
 * interactive solvers, graph support, and simulation links.
 */

import { Equation } from '@/database/models/knowledge/equation.model';
import { AppError } from '@/types';
import { IEquation } from '@/types';
import type { CreateEquationInput } from '@/validations/knowledge';

export interface EquationFilter {
  domain?: string;
  conceptId?: string;
  graphSupport?: boolean;
  isPublished?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export class EquationService {
  static async create(input: CreateEquationInput): Promise<IEquation> {
    const existing = await Equation.findOne({ equationId: input.equationId });
    if (existing) throw new AppError(409, 'Equation already exists', 'EQUATION_EXISTS');

    const doc = await Equation.create(input);
    return doc.toJSON() as IEquation;
  }

  static async getByEquationId(equationId: string): Promise<IEquation> {
    const doc = await Equation.findOne({ equationId });
    if (!doc) throw new AppError(404, 'Equation not found', 'EQUATION_NOT_FOUND');
    return doc.toJSON() as IEquation;
  }

  static async update(equationId: string, patch: Partial<CreateEquationInput>): Promise<IEquation> {
    if (patch.equationId) throw new AppError(400, 'equationId is immutable', 'IMMUTABLE_FIELD');
    const doc = await Equation.findOneAndUpdate({ equationId }, { $set: patch }, { new: true });
    if (!doc) throw new AppError(404, 'Equation not found', 'EQUATION_NOT_FOUND');
    return doc.toJSON() as IEquation;
  }

  static async remove(equationId: string): Promise<void> {
    const res = await Equation.findOneAndDelete({ equationId });
    if (!res) throw new AppError(404, 'Equation not found', 'EQUATION_NOT_FOUND');
  }

  static async list(filter: EquationFilter = {}) {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(filter.pageSize ?? 20, 100);

    const query: Record<string, unknown> = {};
    if (filter.domain) query.domain = filter.domain;
    if (filter.conceptId) query.conceptIds = filter.conceptId;
    if (typeof filter.graphSupport === 'boolean') query.graphSupport = filter.graphSupport;
    if (typeof filter.isPublished === 'boolean') query.isPublished = filter.isPublished;
    if (filter.search) query.$text = { $search: filter.search };

    const [items, total] = await Promise.all([
      Equation.find(query)
        .sort({ label: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Equation.countDocuments(query),
    ]);
    return { items, total };
  }

  static async listSolvable(): Promise<IEquation[]> {
    const docs = await Equation.find({ 'interactiveSolver.enabled': true }).lean();
    return docs.map((d) => d as IEquation);
  }
}
