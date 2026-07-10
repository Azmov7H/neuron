/**
 * GET /api/knowledge/equations             → list/filter equations
 * POST /api/knowledge/equations            → create equation (curator+)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { EquationService, EquationFilter } from '@/modules/knowledge/equation.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateEquationSchema } from '@/validations/knowledge';
import { ScientificDomain } from '@/types';

function parseFilter(request: NextRequest): EquationFilter {
  const p = new URL(request.url).searchParams;
  const filter: Record<string, unknown> = {};
  if (p.get('domain')) filter.domain = p.get('domain') as ScientificDomain;
  if (p.get('conceptId')) filter.conceptId = p.get('conceptId')!;
  if (p.get('graphSupport')) filter.graphSupport = p.get('graphSupport') === 'true';
  if (p.get('isPublished')) filter.isPublished = p.get('isPublished') === 'true';
  if (p.get('search')) filter.search = p.get('search')!;
  if (p.get('page')) filter.page = Number(p.get('page'));
  if (p.get('pageSize')) filter.pageSize = Number(p.get('pageSize'));
  return filter as EquationFilter;
}

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const filter = parseFilter(request);
  const { items, total } = await EquationService.list(filter);
  const page = filter.page ?? 1;
  const pageSize = Math.min(filter.pageSize ?? 20, 100);
  return ApiResponseHandler.paginated(items, total, page, pageSize, 'Equations retrieved');
}

async function postHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const body = await request.json();
  const validation = CreateEquationSchema.safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const equation = await EquationService.create(validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'create',
    entity: 'Equation',
    entityId: equation.equationId,
  });
  return ApiResponseHandler.created(equation, 'Equation created');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const POST = withErrorHandling(requireRole('curator')(requireAuth(postHandler)));
