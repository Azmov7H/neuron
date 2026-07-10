/**
 * GET /api/knowledge/concepts
 * List/filter concepts (pagination, full-text search, facet filters).
 *
 * POST /api/knowledge/concepts
 * Create a concept (curator+).
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { ConceptService } from '@/modules/knowledge/concept.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateConceptSchema } from '@/validations/knowledge';
import { Difficulty, LearningLevel, ScientificDomain } from '@/types';

function parseFilter(request: NextRequest): Parameters<typeof ConceptService.list>[0] {
  const url = new URL(request.url);
  const p = url.searchParams;
  const filter: Record<string, unknown> = {};

  const domain = p.get('domain');
  if (domain) filter.domain = domain as ScientificDomain;
  const difficulty = p.get('difficulty');
  if (difficulty) filter.difficulty = difficulty as Difficulty;
  const learningLevel = p.get('learningLevel');
  if (learningLevel) filter.learningLevel = learningLevel as LearningLevel;
  if (p.get('isPublished')) filter.isPublished = p.get('isPublished') === 'true';
  if (p.get('prerequisiteOf')) filter.prerequisiteOf = p.get('prerequisiteOf')!;
  if (p.get('relatedTo')) filter.relatedTo = p.get('relatedTo')!;
  if (p.get('search')) filter.search = p.get('search')!;
  if (p.get('sort')) filter.sort = p.get('sort') as 'importance' | 'views' | 'recent' | 'title';
  if (p.get('page')) filter.page = Number(p.get('page'));
  if (p.get('pageSize')) filter.pageSize = Number(p.get('pageSize'));
  return filter as Parameters<typeof ConceptService.list>[0];
}

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { items, total } = await ConceptService.list(parseFilter(request));
  return ApiResponseHandler.paginated(items, total, 1, items.length, 'Concepts retrieved');
}

async function postHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const body = await request.json();
  const validation = CreateConceptSchema.safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const concept = await ConceptService.create(validation.data);

  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'create',
    entity: 'Concept',
    entityId: concept.conceptId,
  });

  return ApiResponseHandler.created(concept, 'Concept created');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const POST = withErrorHandling(requireRole('curator')(requireAuth(postHandler)));
