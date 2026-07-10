/**
 * GET /api/knowledge/glossary/[slug]      → term by slug
 * PUT /api/knowledge/glossary/[slug]      → update (contributor+)
 * DELETE /api/knowledge/glossary/[slug]   → delete (admin)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { GlossaryService } from '@/modules/knowledge/glossary.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateGlossaryTermSchema } from '@/validations/knowledge';

async function getHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const term = await GlossaryService.getBySlug(slug);
  return ApiResponseHandler.success(term, 'Glossary term retrieved');
}

async function putHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const term = await GlossaryService.getBySlug(slug);

  const body = await request.json();
  const validation = CreateGlossaryTermSchema.partial().safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const updated = await GlossaryService.update(term.termId, validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'update',
    entity: 'GlossaryTerm',
    entityId: term.termId,
  });
  return ApiResponseHandler.success(updated, 'Glossary term updated');
}

async function deleteHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const term = await GlossaryService.getBySlug(slug);
  await GlossaryService.remove(term.termId);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'delete',
    entity: 'GlossaryTerm',
    entityId: term.termId,
  });
  return ApiResponseHandler.success({ deleted: true }, 'Glossary term deleted');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const PUT = withErrorHandling(requireRole('contributor')(requireAuth(putHandler)));
export const DELETE = withErrorHandling(requireRole('admin')(requireAuth(deleteHandler)));
