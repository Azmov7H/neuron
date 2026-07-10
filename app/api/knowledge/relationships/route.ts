/**
 * GET /api/knowledge/relationships            → list/filter edges
 * POST /api/knowledge/relationships           → create edge (curator+)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { RelationshipService, RelationshipFilter } from '@/modules/knowledge/relationship.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateRelationshipSchema } from '@/validations/knowledge';
import { RelationshipType } from '@/types';

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const p = new URL(request.url).searchParams;
  const filter: Record<string, unknown> = {};
  if (p.get('sourceId')) filter.sourceId = p.get('sourceId')!;
  if (p.get('targetId')) filter.targetId = p.get('targetId')!;
  if (p.get('type')) filter.type = p.get('type') as RelationshipType;
  if (p.get('page')) filter.page = Number(p.get('page'));
  if (p.get('pageSize')) filter.pageSize = Number(p.get('pageSize'));

  const { items, total } = await RelationshipService.list(filter as never);
  return ApiResponseHandler.paginated(items, total, 1, items.length, 'Relationships retrieved');
}

async function postHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const body = await request.json();
  const validation = CreateRelationshipSchema.safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const rel = await RelationshipService.create(validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'create',
    entity: 'Relationship',
    entityId: (rel as { _id?: string })._id?.toString(),
  });
  return ApiResponseHandler.created(rel, 'Relationship created');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const POST = withErrorHandling(requireRole('curator')(requireAuth(postHandler)));
