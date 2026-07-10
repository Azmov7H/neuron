/**
 * GET /api/knowledge/references/[id]         → reference by referenceId
 * PUT /api/knowledge/references/[id]         → update (contributor+)
 * DELETE /api/knowledge/references/[id]      → delete (admin)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { ReferenceService } from '@/modules/knowledge/reference.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateReferenceSchema } from '@/validations/knowledge';

async function getHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { id } = await params;
  const reference = await ReferenceService.getByReferenceId(id);
  return ApiResponseHandler.success(reference, 'Reference retrieved');
}

async function putHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { id } = await params;
  await ReferenceService.getByReferenceId(id);

  const body = await request.json();
  const validation = CreateReferenceSchema.partial().safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const updated = await ReferenceService.update(id, validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'update',
    entity: 'Reference',
    entityId: id,
  });
  return ApiResponseHandler.success(updated, 'Reference updated');
}

async function deleteHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { id } = await params;
  await ReferenceService.getByReferenceId(id);
  await ReferenceService.remove(id);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'delete',
    entity: 'Reference',
    entityId: id,
  });
  return ApiResponseHandler.success({ deleted: true }, 'Reference deleted');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const PUT = withErrorHandling(requireRole('contributor')(requireAuth(putHandler)));
export const DELETE = withErrorHandling(requireRole('admin')(requireAuth(deleteHandler)));
