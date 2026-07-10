/**
 * GET /api/knowledge/scientists            → list/filter scientists
 * POST /api/knowledge/scientists           → create scientist (curator+)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { ScientistService, ScientistFilter } from '@/modules/knowledge/scientist.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateScientistSchema } from '@/validations/knowledge';

function parseFilter(request: NextRequest): ScientistFilter {
  const p = new URL(request.url).searchParams;
  const filter: Record<string, unknown> = {};
  if (p.get('field')) filter.field = p.get('field')!;
  if (p.get('nationality')) filter.nationality = p.get('nationality')!;
  if (p.get('isPublished')) filter.isPublished = p.get('isPublished') === 'true';
  if (p.get('search')) filter.search = p.get('search')!;
  if (p.get('page')) filter.page = Number(p.get('page'));
  if (p.get('pageSize')) filter.pageSize = Number(p.get('pageSize'));
  return filter as ScientistFilter;
}

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const filter = parseFilter(request);
  const { items, total } = await ScientistService.list(filter);
  const page = filter.page ?? 1;
  const pageSize = Math.min(filter.pageSize ?? 20, 100);
  return ApiResponseHandler.paginated(items, total, page, pageSize, 'Scientists retrieved');
}

async function postHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const body = await request.json();
  const validation = CreateScientistSchema.safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const scientist = await ScientistService.create(validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'create',
    entity: 'Scientist',
    entityId: scientist.scientistId,
  });
  return ApiResponseHandler.created(scientist, 'Scientist created');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const POST = withErrorHandling(requireRole('curator')(requireAuth(postHandler)));
