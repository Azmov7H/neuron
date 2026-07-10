/**
 * GET /api/knowledge/references             → list/filter references
 * POST /api/knowledge/references            → create reference (curator+)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { ReferenceService, ReferenceFilter } from '@/modules/knowledge/reference.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateReferenceSchema } from '@/validations/knowledge';
import { ScientificDomain, SourceProvider } from '@/types';

function parseFilter(request: NextRequest): ReferenceFilter {
  const p = new URL(request.url).searchParams;
  const filter: Record<string, unknown> = {};
  if (p.get('provider')) filter.provider = p.get('provider') as SourceProvider;
  if (p.get('domain')) filter.domain = p.get('domain') as ScientificDomain;
  if (p.get('isPeerReviewed')) filter.isPeerReviewed = p.get('isPeerReviewed') === 'true';
  if (p.get('minTrust')) filter.minTrust = Number(p.get('minTrust'));
  if (p.get('search')) filter.search = p.get('search')!;
  if (p.get('page')) filter.page = Number(p.get('page'));
  if (p.get('pageSize')) filter.pageSize = Number(p.get('pageSize'));
  return filter as ReferenceFilter;
}

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const filter = parseFilter(request);
  const { items, total } = await ReferenceService.list(filter);
  const page = filter.page ?? 1;
  const pageSize = Math.min(filter.pageSize ?? 20, 100);
  return ApiResponseHandler.paginated(items, total, page, pageSize, 'References retrieved');
}

async function postHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const body = await request.json();
  const validation = CreateReferenceSchema.safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const reference = await ReferenceService.create(validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'create',
    entity: 'Reference',
    entityId: reference.referenceId,
  });
  return ApiResponseHandler.created(reference, 'Reference created');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const POST = withErrorHandling(requireRole('curator')(requireAuth(postHandler)));
