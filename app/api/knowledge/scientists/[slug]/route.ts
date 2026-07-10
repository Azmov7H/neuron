/**
 * GET /api/knowledge/scientists/[slug]      → scientist by slug
 * PUT /api/knowledge/scientists/[slug]      → update (contributor+)
 * DELETE /api/knowledge/scientists/[slug]   → delete (admin)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { ScientistService } from '@/modules/knowledge/scientist.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateScientistSchema } from '@/validations/knowledge';

async function getHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const scientist = await ScientistService.getBySlug(slug);
  return ApiResponseHandler.success(scientist, 'Scientist retrieved');
}

async function putHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const scientist = await ScientistService.getBySlug(slug);

  const body = await request.json();
  const validation = CreateScientistSchema.partial().safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const updated = await ScientistService.update(scientist.scientistId, validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'update',
    entity: 'Scientist',
    entityId: scientist.scientistId,
  });
  return ApiResponseHandler.success(updated, 'Scientist updated');
}

async function deleteHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const scientist = await ScientistService.getBySlug(slug);
  await ScientistService.remove(scientist.scientistId);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'delete',
    entity: 'Scientist',
    entityId: scientist.scientistId,
  });
  return ApiResponseHandler.success({ deleted: true }, 'Scientist deleted');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const PUT = withErrorHandling(requireRole('contributor')(requireAuth(putHandler)));
export const DELETE = withErrorHandling(requireRole('admin')(requireAuth(deleteHandler)));
