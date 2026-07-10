/**
 * GET /api/knowledge/encyclopedia/[slug]      → article by slug
 * PUT /api/knowledge/encyclopedia/[slug]      → update (contributor+)
 * DELETE /api/knowledge/encyclopedia/[slug]   → delete (admin)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { EncyclopediaService } from '@/modules/knowledge/encyclopedia.service';
import { AuditService } from '@/modules/audit/audit.service';
import { UpdateArticleSchema } from '@/validations/knowledge';

async function getHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const article = await EncyclopediaService.getBySlug(slug);
  return ApiResponseHandler.success(article, 'Article retrieved');
}

async function putHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const article = await EncyclopediaService.getBySlug(slug);

  const body = await request.json();
  const validation = UpdateArticleSchema.safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const updated = await EncyclopediaService.update(article.articleId, validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'update',
    entity: 'EncyclopediaArticle',
    entityId: article.articleId,
  });
  return ApiResponseHandler.success(updated, 'Article updated');
}

async function deleteHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const article = await EncyclopediaService.getBySlug(slug);
  await EncyclopediaService.remove(article.articleId);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'delete',
    entity: 'EncyclopediaArticle',
    entityId: article.articleId,
  });
  return ApiResponseHandler.success({ deleted: true }, 'Article deleted');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const PUT = withErrorHandling(requireRole('contributor')(requireAuth(putHandler)));
export const DELETE = withErrorHandling(requireRole('admin')(requireAuth(deleteHandler)));
