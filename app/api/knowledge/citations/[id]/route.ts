/**
 * GET /api/knowledge/citations/[id]         → citation by citationId
 * PUT /api/knowledge/citations/[id]         → update (contributor+)
 * DELETE /api/knowledge/citations/[id]      → delete (admin)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { CitationService } from '@/modules/knowledge/citation.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateCitationSchema } from '@/validations/knowledge';

async function getHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { id } = await params;
  const citation = await CitationService.getByCitationId(id);
  return ApiResponseHandler.success(citation, 'Citation retrieved');
}

async function putHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { id } = await params;
  await CitationService.getByCitationId(id);

  const body = await request.json();
  const validation = CreateCitationSchema.partial().safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const updated = await CitationService.update(id, validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'update',
    entity: 'Citation',
    entityId: id,
  });
  return ApiResponseHandler.success(updated, 'Citation updated');
}

async function deleteHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { id } = await params;
  await CitationService.getByCitationId(id);
  await CitationService.remove(id);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'delete',
    entity: 'Citation',
    entityId: id,
  });
  return ApiResponseHandler.success({ deleted: true }, 'Citation deleted');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const PUT = withErrorHandling(requireRole('contributor')(requireAuth(putHandler)));
export const DELETE = withErrorHandling(requireRole('admin')(requireAuth(deleteHandler)));
