/**
 * GET /api/knowledge/concepts/[slug]         → concept by slug (+embedding)
 * PUT /api/knowledge/concepts/[slug]         → update (contributor+)
 * DELETE /api/knowledge/concepts/[slug]      → delete + cascade (admin)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { ConceptService } from '@/modules/knowledge/concept.service';
import { AuditService } from '@/modules/audit/audit.service';
import { UpdateConceptSchema } from '@/validations/knowledge';

async function getHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const concept = await ConceptService.getBySlug(slug);
  void ConceptService.incrementViews(concept.conceptId);
  return ApiResponseHandler.success(concept, 'Concept retrieved');
}

async function putHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const concept = await ConceptService.getBySlug(slug);

  const body = await request.json();
  const validation = UpdateConceptSchema.safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const updated = await ConceptService.update(concept.conceptId, validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'update',
    entity: 'Concept',
    entityId: concept.conceptId,
  });
  return ApiResponseHandler.success(updated, 'Concept updated');
}

async function deleteHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const concept = await ConceptService.getBySlug(slug);
  await ConceptService.remove(concept.conceptId);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'delete',
    entity: 'Concept',
    entityId: concept.conceptId,
  });
  return ApiResponseHandler.success({ deleted: true }, 'Concept deleted');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const PUT = withErrorHandling(requireRole('contributor')(requireAuth(putHandler)));
export const DELETE = withErrorHandling(requireRole('admin')(requireAuth(deleteHandler)));
