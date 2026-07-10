/**
 * GET /api/knowledge/timeline/[id]         → event by eventId
 * PUT /api/knowledge/timeline/[id]         → update (contributor+)
 * DELETE /api/knowledge/timeline/[id]      → delete (admin)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { TimelineService } from '@/modules/knowledge/timeline.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateTimelineEventSchema } from '@/validations/knowledge';

async function getHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { id } = await params;
  const event = await TimelineService.getByEventId(id);
  return ApiResponseHandler.success(event, 'Timeline event retrieved');
}

async function putHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { id } = await params;
  await TimelineService.getByEventId(id);

  const body = await request.json();
  const validation = CreateTimelineEventSchema.partial().safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const updated = await TimelineService.update(id, validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'update',
    entity: 'TimelineEvent',
    entityId: id,
  });
  return ApiResponseHandler.success(updated, 'Timeline event updated');
}

async function deleteHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { id } = await params;
  await TimelineService.getByEventId(id);
  await TimelineService.remove(id);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'delete',
    entity: 'TimelineEvent',
    entityId: id,
  });
  return ApiResponseHandler.success({ deleted: true }, 'Timeline event deleted');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const PUT = withErrorHandling(requireRole('contributor')(requireAuth(putHandler)));
export const DELETE = withErrorHandling(requireRole('admin')(requireAuth(deleteHandler)));
