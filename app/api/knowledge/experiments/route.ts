/**
 * GET /api/knowledge/experiments            → list/filter experiments
 * POST /api/knowledge/experiments           → create experiment (curator+)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { ExperimentService, ExperimentFilter } from '@/modules/knowledge/experiment.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateExperimentSchema } from '@/validations/knowledge';
import { Difficulty, ScientificDomain } from '@/types';

function parseFilter(request: NextRequest): ExperimentFilter {
  const p = new URL(request.url).searchParams;
  const filter: Record<string, unknown> = {};
  if (p.get('domain')) filter.domain = p.get('domain') as ScientificDomain;
  if (p.get('conceptId')) filter.conceptId = p.get('conceptId')!;
  if (p.get('difficulty')) filter.difficulty = p.get('difficulty') as Difficulty;
  if (p.get('isPublished')) filter.isPublished = p.get('isPublished') === 'true';
  if (p.get('search')) filter.search = p.get('search')!;
  if (p.get('page')) filter.page = Number(p.get('page'));
  if (p.get('pageSize')) filter.pageSize = Number(p.get('pageSize'));
  return filter as ExperimentFilter;
}

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const filter = parseFilter(request);
  const { items, total } = await ExperimentService.list(filter);
  const page = filter.page ?? 1;
  const pageSize = Math.min(filter.pageSize ?? 20, 100);
  return ApiResponseHandler.paginated(items, total, page, pageSize, 'Experiments retrieved');
}

async function postHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const body = await request.json();
  const validation = CreateExperimentSchema.safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const experiment = await ExperimentService.create(validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'create',
    entity: 'Experiment',
    entityId: experiment.experimentId,
  });
  return ApiResponseHandler.created(experiment, 'Experiment created');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const POST = withErrorHandling(requireRole('curator')(requireAuth(postHandler)));
